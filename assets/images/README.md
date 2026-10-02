# 图片文件夹

将你自己的图片放在这里，然后在项目根目录的 `images.js` 中填写相对路径，例如：

- `avatar.src`: `./assets/images/avatar.webp`
- `wallpapers[0].src`: `./assets/images/wallpaper-city.webp` or `./assets/images/wallpaper.webm`
- `aboutBanner.src`: `./assets/images/about-banner.webp`
- `identities` 和 `games` 中的 `src`: `./assets/images/文件名.webp`
- `musicFallback`: `./assets/images/music-cover.webp`

可以用 JPG、PNG、WebP 或 GIF。壁纸、关于页横幅、身份卡片、游戏卡片和头像都从 `images.js` 读取。壁纸 `src` 填入 `.mp4` 或 `.webm` 路径时会作为循环视频背景播放；WebM 编码需被当前浏览器支持。网易云播放器有曲目封面时仍优先显示曲目封面。
