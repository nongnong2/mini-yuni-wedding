// 텍스트를 클립보드에 복사. 성공하면 true
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 앱 안의 브라우저 등 위 방법이 막힌 곳: 보이지 않는 입력칸에 넣고 복사하는 예전 방식
    const area = document.createElement('textarea')
    area.value = text
    area.readOnly = true
    area.style.cssText = 'position:fixed;opacity:0'
    document.body.append(area)
    area.select()
    const copied = document.execCommand('copy')
    area.remove()
    return copied
  }
}
