export type Language = 'zh' | 'en';

export interface Translations {
  nav: {
    about: string;
    experience: string;
    services: string;
    tools: string;
    contact: string;
    pricing: string;
    login: string;
    register: string;
    switchLang: string;
  };
  hero: {
    badge: string;
    greeting: string;
    title: string;
    description: string;
    description2: string;
    cta: string;
    ctaSecondary: string;
    contactMe: string;
    tryAI: string;
    myStory: string;
    scrollDown: string;
    stats: {
      years: string;
      value: string;
      startup: string;
    };
    name: string;
  };
  experience: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    id: string;
    items: {
      year: string;
      company: string;
      role: string;
      desc: string;
    }[];
  };
  services: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    learnMore: string;
    items: {
      title: string;
      desc: string;
    }[];
  };
  tools: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    searchPlaceholder: string;
    points: string;
    loginToUse: string;
    useTool: string;
    stayTuned: string;
    comingSoon: string;
    footer: string;
    footerPoints: string;
    footerExtra: string;
    modalTitle: string;
    modalDesc: string;
    goLogin: string;
    goRegister: string;
    howToUse: string;
    items: {
      title: string;
      description: string;
      points: number;
    }[];
  };
  footer: {
    contact: string;
    rights: string;
    ctaTitle: string;
    ctaTitleHighlight: string;
    ctaTitleEnd: string;
    ctaSubtitle: string;
    sendEmail: string;
    addWechat: string;
    brandName: string;
    brandDescription: string;
    quickLinks: string;
    contactInfo: string;
    email: string;
    wechat: string;
    redNote: string;
    redNoteStats: string;
    viewProfile: string;
    scanWechat: string;
    scanHint: string;
    copyright: string;
    madeWith: string;
    inChina: string;
  };
}

export const translations: Record<Language, Translations> = {
  zh: {
    nav: {
      about: '关于',
      experience: '经历',
      services: '服务',
      tools: '工具',
      contact: '联系',
      pricing: '会员',
      login: '登录',
      register: '注册',
      switchLang: 'EN',
    },
    hero: {
      badge: 'AI 驱动的医生 IP 工具包',
      greeting: '欢迎来到',
      title: '鹏哥工具箱',
      description: '医生 IP 的 AI 工具包',
      description2: '专为医生打造的 AI 工具集，助力个人 IP 打造、内容创作与私域变现。',
      cta: '立即体验',
      ctaSecondary: '了解更多',
      contactMe: '联系我们',
      tryAI: '试用AI工具',
      myStory: '了解更多',
      scrollDown: '向下滚动',
      stats: {
        years: '专业医生IP工具',
        value: '积分兑换使用',
        startup: '持续更新迭代',
      },
      name: '鹏哥工具箱',
    },
    experience: {
      title: '我的 ',
      titleHighlight: '职业历程',
      subtitle: '从药学到销售，再到AI创业与IP运营，每一步都算数',
      id: 'experience',
      items: [
        {
          year: '2022-至今',
          company: '医生流量合伙人',
          role: '专注IP运营',
          desc: '帮助多位医生从0到1打造个人品牌，实现私域流量转化',
        },
        {
          year: '2018-2022',
          company: '海外医疗项目',
          role: '合伙人',
          desc: '在非洲尼日利亚建立连锁诊所，深耕海外医疗市场',
        },
        {
          year: '2017-2018',
          company: 'AI医疗创业',
          role: '联合创始人',
          desc: '获得数千万融资，探索AI在医疗场景的落地应用',
        },
        {
          year: '2015-2016',
          company: '个人品牌创业',
          role: '创始人',
          desc: '早期尝试医生个人品牌孵化，积累第一手流量经验',
        },
        {
          year: '2014',
          company: '新氧',
          role: '华南区医生BD',
          desc: '负责医美医生拓展与运营，深入理解平台流量逻辑',
        },
        {
          year: '2010-2014',
          company: '辉瑞制药',
          role: '医药销售',
          desc: '积累扎实的医疗行业底蕴与专业销售能力',
        },
        {
          year: '2006-2010',
          company: '厦门大学医学院',
          role: '医学专业',
          desc: '本科学习，构建医学基础认知体系',
        },
      ],
    },
    services: {
      title: '我的服务',
      titleHighlight: '',
      subtitle: '从流量获取到私域变现的全链路解决方案',
      learnMore: '了解更多',
      items: [
        {
          title: 'IP代运营',
          desc: '全平台账号托管，内容策划、拍摄剪辑、发布运营一站式服务，按效果分成',
        },
        {
          title: 'AI+流量陪跑',
          desc: '手把手教你使用AI工具提升效率，传授经过验证的流量获取方法论',
        },
        {
          title: '私域变现咨询',
          desc: '设计高转化的私域路径，帮助你建立可持续的商业闭环',
        },
      ],
    },
    tools: {
      badge: 'AI 工具',
      title: '医生IP的 ',
      titleHighlight: 'AI 工具包',
      subtitle: '注册即可使用，积分兑换，持续更新',
      searchPlaceholder: '搜索工具...',
      points: '积分',
      loginToUse: '登录使用',
      useTool: '立即使用',
      stayTuned: '敬请期待',
      comingSoon: '即将上线',
      modalTitle: '请先登录',
      modalDesc: '登录或注册后即可使用 AI 工具',
      goLogin: '去登录',
      goRegister: '去注册',
      howToUse: '怎么用',
      footer: '注册即送',
      footerPoints: '100积分',
      footerExtra: '，邀请好友可获更多积分奖励',
      items: [],
    },
    footer: {
      contact: '联系方式',
      rights: '© 2025 鹏哥工具箱. All rights reserved.',
      ctaTitle: '开始使用 ',
      ctaTitleHighlight: 'AI 医生IP工具',
      ctaTitleEnd: '',
      ctaSubtitle: '注册即送 100 积分，立即体验专业 AI 医生IP工具包。',
      sendEmail: '联系我们',
      addWechat: '加微信',
      brandName: '鹏哥工具箱',
      brandDescription: '专为医生打造的 AI 工具平台，助力个人 IP 打造、内容创作与私域变现。',
      quickLinks: '快速链接',
      contactInfo: '联系我们',
      email: '邮件',
      wechat: '微信',
      redNote: '小红书',
      redNoteStats: '',
      viewProfile: '查看主页',
      scanWechat: '扫码联系',
      scanHint: '',
      copyright: '© {year} 鹏哥工具箱',
      madeWith: 'Made with',
      inChina: 'in China',
    },
  },
  en: {
    nav: {
      about: 'About',
      experience: 'Experience',
      services: 'Services',
      tools: 'Tools',
      contact: 'Contact',
      pricing: 'Pricing',
      login: 'Login',
      register: 'Sign Up',
      switchLang: '中',
    },
    hero: {
      badge: 'AI-Powered Medical Aesthetics Platform',
      greeting: 'Welcome to',
      title: 'MedAI Studio',
      description: 'AI Medical Aesthetics Content Platform',
      description2: 'Professional AI tools for medical aesthetics practitioners. Boost content creation efficiency and brand growth.',
      cta: 'Get Started',
      ctaSecondary: 'Learn More',
      contactMe: 'Contact Us',
      tryAI: 'Try AI Tools',
      myStory: 'Learn More',
      scrollDown: 'Scroll Down',
      stats: {
        years: 'Pro Tools',
        value: 'Points System',
        startup: 'Always Updated',
      },
      name: 'MedAI Studio',
    },
    experience: {
      title: 'My ',
      titleHighlight: 'Journey',
      subtitle: 'From pharmacy to sales, to AI startups and IP operation.',
      id: 'experience',
      items: [
        {
          year: '2022-Present',
          company: 'Doctor Traffic Partner',
          role: 'IP Operation',
          desc: 'Helping doctors build personal brands and monetize traffic',
        },
        {
          year: '2018-2022',
          company: 'Overseas Medical Project',
          role: 'Partner',
          desc: 'Established chain clinics in Nigeria, deeply involved in overseas markets',
        },
        {
          year: '2017-2018',
          company: 'AI Medical Startup',
          role: 'Co-founder',
          desc: 'Secured multi-million funding, exploring AI applications in healthcare',
        },
        {
          year: '2015-2016',
          company: 'Personal Brand Startup',
          role: 'Founder',
          desc: 'Early attempts at doctor personal branding incubation',
        },
        {
          year: '2014',
          company: 'SoYoung',
          role: 'Doctor BD (South China)',
          desc: 'Responsible for doctor expansion and operation',
        },
        {
          year: '2010-2014',
          company: 'Pfizer',
          role: 'Medical Sales',
          desc: 'Solid medical industry background and professional sales skills',
        },
        {
          year: '2006-2010',
          company: 'Xiamen University School of Medicine',
          role: 'Medicine',
          desc: 'Bachelor degree, building medical knowledge foundation',
        },
      ],
    },
    services: {
      title: 'Services',
      titleHighlight: '',
      subtitle: 'Full-link solutions from traffic acquisition to monetization',
      learnMore: 'Learn More',
      items: [
        {
          title: 'IP Operation',
          desc: 'Full platform account management, content planning, and operation services',
        },
        {
          title: 'AI + Traffic Training',
          desc: 'Teaching you how to use AI tools for efficiency and traffic acquisition',
        },
        {
          title: 'Monetization Consulting',
          desc: 'Designing high-conversion private domain paths for sustainable business',
        },
      ],
    },
    tools: {
      badge: 'AI Tools',
      title: 'Medical Aesthetics ',
      titleHighlight: 'AI Toolbox',
      subtitle: 'Register to use, points-based, continuously updated',
      searchPlaceholder: 'Search tools...',
      points: 'Points',
      loginToUse: 'Login to Use',
      useTool: 'Use Now',
      stayTuned: 'Stay Tuned',
      comingSoon: 'Coming Soon',
      modalTitle: 'Login Required',
      modalDesc: 'Please login or register to use AI tools',
      goLogin: 'Login',
      goRegister: 'Register',
      howToUse: 'How to Use',
      footer: 'Get ',
      footerPoints: '100 Points',
      footerExtra: ' upon registration, invite friends for more!',
      items: [],
    },
    footer: {
      contact: 'Contact',
      rights: '© 2025 MedAI Studio. All rights reserved.',
      ctaTitle: 'Start Using ',
      ctaTitleHighlight: 'AI Medical Aesthetics Tools',
      ctaTitleEnd: '',
      ctaSubtitle: 'Get 100 points upon registration. Try professional AI tools now.',
      sendEmail: 'Contact Us',
      addWechat: 'Add WeChat',
      brandName: 'MedAI Studio',
      brandDescription: 'AI tool platform for medical aesthetics practitioners. Boost content creation and brand growth.',
      quickLinks: 'Quick Links',
      contactInfo: 'Contact',
      email: 'Email',
      wechat: 'WeChat',
      redNote: 'RedNote',
      redNoteStats: '',
      viewProfile: 'View Profile',
      scanWechat: 'Scan to Contact',
      scanHint: '',
      copyright: '© {year} MedAI Studio',
      madeWith: 'Made with',
      inChina: 'in China',
    },
  },
};
