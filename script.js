const form = document.getElementById('genForm')
const statusEl = document.getElementById('status')
const previewImg = document.getElementById('previewImg')
const previewLoader = document.getElementById('previewLoader')
const downloadLink = document.getElementById('downloadLink')
const downloadBtn = document.getElementById('downloadBtn')
const generateBtn = document.getElementById('generateBtn')
let isGenerating = false

function setPreviewLoading(isLoading) {
	if (!previewLoader) return
	previewLoader.classList.toggle('hidden', !isLoading)
}

async function submitGeneration(payload) {
	// on local server(server.js)

	// const res = await fetch('http://localhost:3000/generateposter', {
	// 	method: 'POST',
	// 	headers: { 'Content-Type': 'application/json' },
	// 	body: JSON.stringify(payload)
	// })

	//   When Deploying 

	const res = await fetch('/api/generate', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(payload)
	})
	
	const data = await res.json()
	if (!res.ok) throw new Error(data?.error || 'generation_failed')
	return data
}

form?.addEventListener('submit', async (e) => {
	e.preventDefault()
	if (isGenerating) return
	isGenerating = true
	if (generateBtn) generateBtn.disabled = true
	statusEl.textContent = 'Generating...'
	setPreviewLoading(true)
	downloadLink.setAttribute('href', '#')

	const fd = new FormData(form)
	const payload = {
		generationType: fd.get('generationType') || 'poster',
		eventName: fd.get('eventName') || '',
		theme: fd.get('theme') || '',
		date: fd.get('date') || '',
		eventType: fd.get('eventType') || '',
		extraPrompt: fd.get('extraPrompt') || '',
		aspect_ratio: fd.get('aspect_ratio') || '3:2'
	}

	try {
		const { href } = await submitGeneration(payload)
		if (href) {
			previewImg.src = href
			downloadLink.href = href
			statusEl.textContent = 'Done'
		} else {
			statusEl.textContent = 'No image returned'
		}
	} catch (err) {
		console.error(err)
		statusEl.textContent = `Error: ${err.message || err}`
	} finally {
		isGenerating = false
		if (generateBtn) generateBtn.disabled = false
		setPreviewLoading(false)
	}
})

// Expose function if needed elsewhere
window.generatePoster = async function generatePoster() {
	form?.dispatchEvent(new Event('submit'))
}

// Download current image as a file
downloadBtn?.addEventListener('click', async () => {
	const src = previewImg?.getAttribute('src')
	if (!src) {
		statusEl.textContent = 'No image to download'
		return
	}
	try {
		statusEl.textContent = 'Preparing download...'
		const proxyUrl = `http://localhost:3000/download-image?url=${encodeURIComponent(src)}`
		const resp = await fetch(proxyUrl)
		if (!resp.ok) {
			const errPayload = await resp.json().catch(() => null)
			throw new Error(errPayload?.error || 'download_failed')
		}
		const blob = await resp.blob()
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		const header = resp.headers.get('Content-Disposition') || ''
		const fileNameMatch = header.match(/filename="([^"]+)"/)
		a.download = fileNameMatch?.[1] || `poster_${Date.now()}.png`
		document.body.appendChild(a)
		a.click()
		URL.revokeObjectURL(url)
		a.remove()
		statusEl.textContent = 'Downloaded'
	} catch (e) {
		console.error(e)
		statusEl.textContent = 'Download failed'
	}
})
