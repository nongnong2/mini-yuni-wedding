// 사용법: npm run qr -- https://아이디.github.io/저장소이름/
import QRCode from 'qrcode'

const url = process.argv[2]
if (!url) {
  console.log('주소를 함께 입력하세요. 예: npm run qr -- https://아이디.github.io/wedding-invitation/')
  process.exit(1)
}

// 인쇄해도 선명하도록 1000px, 청첩장 톤에 맞춘 짙은 갈색
await QRCode.toFile('qr.png', url, { width: 1000, margin: 2, color: { dark: '#4a3f35' } })
console.log(`qr.png 생성 완료 → ${url}`)
