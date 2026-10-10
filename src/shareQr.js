// Generate QR only when a user explicitly requests it. No QR request goes to a server.
export async function renderQrDataUrl(link) {
  const { toDataURL } = await import('qrcode')
  return toDataURL(link, { errorCorrectionLevel: 'M', margin: 2, width: 260, type: 'image/png' })
}
