/*
 * Moxan image library
 * Replace each `src` value with a URL or a path relative to the site root.
 * Example: './assets/images/avatar.webp' or './assets/images/wallpaper.webm'
 * Add your image or video files under assets/images/ and keep their paths here. A wallpaper src ending in .mp4 or .webm is played as a looping background video.
 * The NetEase player uses the cover URL returned by its API when available.
 */
window.MoxanImages = {
  avatar: {
    src: './assets/images/head.png', // Leave empty to show the M monogram, or set your own portrait.
    alt: 'Mogo 的头像'
  },

  wallpapers: [
    {
      id: 'miphablue',
      name: 'mipha（Blue）',
      environment: 'rain',
      src: './assets/images/miphablue.png',
      position: 'center 48%',
      mobilePosition: 'center 44%'
    },
    {
      id: 'miphared',
      name: 'mipha（Red）',
      environment: 'particles',
      src: './assets/images/miphared.jpg',
      position: 'center 46%',
      mobilePosition: 'center 44%'
    },
    {
      id: 'link',
      name: 'Link',
      environment: 'particles',
      src: './assets/images/link.webm',
      position: 'center 46%',
      mobilePosition: 'center 44%'
    },
    {
      id: 'hui1',
      name: 'Hui Liyi 1',
      environment: 'particles',
      src: './assets/images/hui1.webm',
      position: 'center 46%',
      mobilePosition: 'center 44%'
    },
    {
      id: 'hui2',
      name: 'Hui Liyi 2',
      environment: 'particles',
      src: './assets/images/hui2.webm',
      position: 'center 46%',
      mobilePosition: 'center 44%'
    },
    {
      id: 'wood',
      name: 'The Wood',
      environment: 'snow',
      src: './assets/images/wood.png',
      position: 'center 53%',
      mobilePosition: 'center 47%'
    }
  ],

  aboutBanner: {
    src: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1100&q=82',
    alt: '夜色中的城市与灯光'
  },

  identities: [
    {
      label: 'ENGINEERING / 01',
      title: '前端架构开发',
      src: './assets/images/coding.png',
      alt: '夜色里的开发工作桌'
    },
    {
      label: 'MUSIC / 02',
      title: '网易云音乐人',
      src: './assets/images/wyyyyr.png',
      alt: 'Music!！'
    },
    {
      label: 'STUDIO / 03',
      title: '电子音乐爱好者',
      src: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=720&q=80',
      alt: '无需多言'
    }
  ],

  games: [
    {
      name: 'Minecraft', genre: 'SANDBOX / BUILD', note: '方块世界与慢慢长大的基地。',
      src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=780&q=80', alt: '山谷与湖泊'
    },
    {
      name: 'The Legend of Zelda', genre: 'ADVENTURE / HYRULE', note: '探索、解谜，还有旷野的风。',
      src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=780&q=80', alt: '山间日出与湖面'
    },
    {
      name: '王牌竞速', genre: 'RACING / ASPHALT', note: '巅峰车神（doge',
      src: './assets/images/wpjs.jpg', alt: '夜色里的跑车'
    },
    {
      name: '逆水寒', genre: 'MMORPG / WUXIA', note: '在江湖里走走停停。',
      src: './assets/images/nsh.jpg', alt: '朦胧的海边景色'
    },
    {
      name: '明日之后', genre: 'SURVIVAL / CO-OP', note: '废土里的营地和同行的人。',
      src: './assets/images/mrzh.jpg', alt: '林地中的雾气'
    },
    {
      name: 'Euro Truck Simulator 2', genre: 'SIM / LONG DRIVE', note: '一首歌的时间，开过很多公路。',
      src: './assets/images/ets.jpg', alt: '公路运输卡车'
    },
    {
      name: 'Forza Horizon', genre: 'RACING / OPEN ROAD', note: '开阔道路和随手切的歌单。',
      src: './assets/images/dpx.jpg', alt: '蜿蜒的山路与开阔风景'
    }
  ],

  musicFallback: '' // Optional cover used only if a track has no API cover.
};
