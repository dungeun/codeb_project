const fs = require('fs');
const path = require('path');

// 간단한 비프음을 생성하는 Base64 인코딩된 MP3 데이터
// 이것은 짧은 "띵" 소리를 만듭니다
const notificationSoundBase64 = 'SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHMA//uSwAAAAAABLBQAAAMoA/8y8pAABEREREQAAICAgICAAgICAgICBEREREQAAICAgICAAgICAgICBERERETu7u7u7u7oiIiIiIiI6O7u7u7u7uiIiIiIiIjo7u7u7u7u6IiIiIiIiOju7u7u7u7oiIiIiIiI6O7u7u7u7uiIiIiIiIjo7u7u7u7u6IiIiIiIiOju7u7u7u7oiIiIiIiI6O7u7u7u7uiIiIiIiIjo7u7u7u7u6IiIiIiIiOju7u7u7u7oiIiIiIiI6O7u7u7u7v/7ksAOAGMogGTmHgAgAAA0goAABO7uiIiIiIiIjo7u7u7u7u6IiIiIiIiOju7u7u7u7oiIiIiIiI6O7u7u7u7uiIiIiIiIjo7u7u7u7u6IiIiIiIiOju7u7u7u7oiIiIiIiI6O7u7u7u7uiIiIiIiIjv/////////////////////////////////////////////////////////////////////////////////////////////////////////7ksBOg/AAAGkAAAAIAAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';

// Base64를 버퍼로 변환
const buffer = Buffer.from(notificationSoundBase64, 'base64');

// sounds 디렉토리 생성
const soundsDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// MP3 파일 저장
const filePath = path.join(soundsDir, 'notification.mp3');
fs.writeFileSync(filePath, buffer);

console.log('Notification sound created at:', filePath);