import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const KREA_API_BASE = 'https://api.krea.ai'
const KREA_MODEL_PATH = '/generate/image/bfl/flux-1-dev'
const KREA_API_TOKEN = process.env.KREA_API_TOKEN
const ALLOWED_IMAGE_HOSTS = new Set(['gen.krea.ai', 'krea.ai', 'cdn.krea.ai'])

app.post('/generateposter', async (req, res) => {
	try {
		const {
			prompt,
			aspect_ratio = '3:2',
			generationType = 'poster',
			eventName = '',
			theme = '',
			date = '',
			eventType = '',
			extraPrompt = ''
		} = req.body || {}

		// Build a helpful default prompt if none provided
		const finalPrompt = prompt && String(prompt).trim().length > 0
			? prompt
			: buildPrompt({ generationType, eventName, theme, date, eventType, extraPrompt })
		if (!finalPrompt) return res.status(400).json({ error: 'missing_prompt' })
		if (!KREA_API_TOKEN) return res.status(500).json({ error: 'missing_krea_api_token' })

		const createResponse = await fetch(`${KREA_API_BASE}${KREA_MODEL_PATH}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${KREA_API_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				prompt: finalPrompt,
				...getImageSizeFromAspect(aspect_ratio)
			})
		})

		const createPayload = await createResponse.json().catch(() => null)
		if (!createResponse.ok) {
			return res.status(502).json({
				error: 'krea_create_failed',
				status: createResponse.status,
				detail: createPayload
			})
		}

		const href = await waitForKreaImageHref(createPayload)
		if (!href) return res.status(502).json({ error: 'unexpected_output_shape', output: createPayload })
		// console.log('Krea image URL:', href)
		return res.json({ href })
	} catch (e) {
		console.error('generateposter error', e)
		return res.status(500).json({ error: 'generation_failed', detail: e.message })
	}
})

app.get('/download-image', async (req, res) => {
	try {
		const urlParam = String(req.query.url || '')
		if (!urlParam) return res.status(400).json({ error: 'missing_url' })

		let parsedUrl
		try {
			parsedUrl = new URL(urlParam)
		} catch (_) {
			return res.status(400).json({ error: 'invalid_url' })
		}

		if (parsedUrl.protocol !== 'https:') {
			return res.status(400).json({ error: 'invalid_protocol' })
		}
		if (!ALLOWED_IMAGE_HOSTS.has(parsedUrl.hostname)) {
			return res.status(400).json({ error: 'host_not_allowed' })
		}

		const upstream = await fetch(parsedUrl.toString())
		if (!upstream.ok) {
			return res.status(502).json({ error: 'image_fetch_failed', status: upstream.status })
		}

		const contentType = upstream.headers.get('content-type') || 'image/png'
		const body = Buffer.from(await upstream.arrayBuffer())
		const ext = contentType.includes('jpeg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png'
		const fileName = `poster_${Date.now()}.${ext}`

		res.setHeader('Content-Type', contentType)
		res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
		return res.send(body)
	} catch (e) {
		console.error('download-image error', e)
		return res.status(500).json({ error: 'download_failed', detail: e.message })
	}
})

function buildPrompt({ generationType, eventName, theme, date, eventType, extraPrompt }) {
	const typeLabel = generationType === 'logo' ? 'Logo' : 'Poster'
	const parts = [
		`${typeLabel} design for ${eventName || 'an event'}`,
		theme ? `${theme}` : null,
		eventType ? `${eventType} theme` : null,
		date ? `Date: ${date}` : null,
		'clear readable text, modern typography, high contrast, professional composition',
		extraPrompt || null
	].filter(Boolean)
	return parts.join(', ')
}

function extractHref(payload) {
	if (!payload) return null
	if (typeof payload === 'string') return payload
	if (payload.image_url) return payload.image_url
	if (payload.url) return payload.url
	if (Array.isArray(payload.urls) && payload.urls.length > 0) return payload.urls[0]
	if (payload.image?.url) return payload.image.url
	if (Array.isArray(payload.images) && payload.images.length > 0) {
		const firstImage = payload.images[0]
		if (typeof firstImage === 'string') return firstImage
		if (firstImage?.url) return firstImage.url
		if (firstImage?.image_url) return firstImage.image_url
	}
	if (payload.output) return extractHref(payload.output)
	if (payload.result) return extractHref(payload.result)
	return null
}

async function waitForKreaImageHref(createPayload) {
	const immediateHref = extractHref(createPayload)
	if (immediateHref) return immediateHref

	const jobId = createPayload?.job_id
	if (!jobId) return null

	const maxAttempts = 50
	const delayMs = 2000

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		const statusPayload = await getKreaJob(jobId)
		const hrefFromStatus = extractHref(statusPayload)
		if (hrefFromStatus) return hrefFromStatus

		const status = String(statusPayload?.status || '').toLowerCase()
		if (status === 'failed' || status === 'cancelled' || status === 'canceled') {
			const detail = statusPayload?.result?.error || statusPayload?.error || 'krea_job_failed'
			throw new Error(String(detail))
		}

		await sleep(delayMs)
	}

	return null
}

async function getKreaJob(jobId) {
	const response = await fetch(`${KREA_API_BASE}/jobs/${jobId}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${KREA_API_TOKEN}`
		}
	})
	if (!response.ok) {
		throw new Error(`krea_status_failed_${response.status}`)
	}
	return response.json()
}

function getImageSizeFromAspect(aspectRatio = '3:2') {
	const map = {
		'1:1': { width: 1024, height: 1024 },
		'3:2': { width: 1536, height: 1024 },
		'2:3': { width: 1024, height: 1536 },
		'4:3': { width: 1365, height: 1024 },
		'3:4': { width: 1024, height: 1365 },
		'16:9': { width: 1536, height: 864 },
		'9:16': { width: 864, height: 1536 }
	}
	return map[aspectRatio] || map['3:2']
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

// vercel configs

module.exports = app;

// const PORT = process.env.PORT || 3000
// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
