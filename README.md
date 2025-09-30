# SoundKeeper UI (MVP)

Минимальный интерфейс управления сетевыми аудиоплеерами.

## Запуск
1) Установите Node.js LTS.
2) `npm i`
3) `npm run dev` (откроется http://localhost:5173)

> Прокси на /api направлен на бекенд http://localhost:8080 (см. vite.config.js).

## Страницы
- Панель: сканирование устройств, быстрые Play/Stop/Volume.
- Контент: просмотр/загрузка файлов на устройство.
- Остальные — как заглушки (будут дорабатываться).

## Примечание
Это фронтенд. Бекенд должен реализовать конечные точки:
- `GET /api/devices/scan`
- `GET /api/devices`
- `POST /api/device/:ip/play {file}`
- `POST /api/device/:ip/stop`
- `POST /api/device/:ip/volume {level}`
- `GET /api/device/:ip/files`
- `POST /api/device/:ip/upload (multipart)`
