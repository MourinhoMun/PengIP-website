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
      badge: '专注IP流量运营和AI工具开发',
      greeting: '你好，我是',
      title: '你好，我是 鹏哥',
      description: '医生IP运营者和AI工具开发者',
      description2: '10年医疗行业深耕，从医药销售到AI创业。实现长期主义IP的流量变现与价值提升。',
      cta: '联系我',
      ctaSecondary: '了解我的故事',
      contactMe: '联系我',
      tryAI: '试用AI工具',
      myStory: '我的故事',
      scrollDown: '向下滚动',
      stats: {
        years: '10+年 行业经验',
        value: '百万级 IP变现',
        startup: '千万级 创业融资',
      },
      name: '鹏哥',
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
      badge: '试用AI工具',
      title: '医生专属 ',
      titleHighlight: 'AI效率工具箱',
      subtitle: '解决内容创作痛点',
      searchPlaceholder: '搜索工具...',
      points: '积分',
      loginToUse: '登录使用',
      useTool: '立即使用',
      stayTuned: '敬请期待',
      comingSoon: '即将上线',
      modalTitle: '请先登录',
      modalDesc: '登录或注册后即可使用AI工具',
      goLogin: '去登录',
      goRegister: '去注册',
      howToUse: '怎么用',
      footer: '注册即送',
      footerPoints: '100积分',
      footerExtra: '，邀请同行可获更多积分奖励',
      items: [],
    },
    footer: {
      contact: '联系方式',
      rights: '© 2024 鹏哥. All rights reserved.',
      ctaTitle: '准备好 ',
      ctaTitleHighlight: '开启你的 IP 之旅',
      ctaTitleEnd: ' 了吗？',
      ctaSubtitle: '无论你是想打造个人品牌，还是尝试 AI 辅助创作，我都愿意助你一臂之力。',
      sendEmail: '发送邮件',
      addWechat: '加微信',
      brandDescription: '专注医疗 IP 孵化与 AI 效率工具开发，帮助医生实现流量变现与品牌增长。',
      quickLinks: '快速链接',
      contactInfo: '联系我',
      email: '邮件',
      wechat: '微信',
      redNote: '小红书',
      redNoteStats: '5万+ 粉丝',
      viewProfile: '查看主页',
      scanWechat: '扫码加微信',
      scanHint: '备注“IP咨询”',
      copyright: '© {year} 鹏哥 IP 与 AI 工具平台',
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
      badge: 'Focus on IP Traffic & AI Tools',
      greeting: 'Hi, I am',
      title: 'Hi, I am Peng Ge',
      description: 'Doctor IP Operator & AI Developer',
      description2: '10 years in medical industry, from sales to AI startup. Realizing long-term IP value and monetization.',
      cta: 'Contact Me',
      ctaSecondary: 'My Story',
      contactMe: 'Contact Me',
      tryAI: 'Try AI Tools',
      myStory: 'My Story',
      scrollDown: 'Scroll Down',
      stats: {
        years: '10+ Years Exp',
        value: 'Million+ Revenue',
        startup: 'Multi-Million Funding',
      },
      name: 'Peng Ge',
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
      badge: 'Try AI Tools',
      title: 'Doctor Exclusive ',
      titleHighlight: 'AI Toolbox',
      subtitle: 'Solving content creation pain points',
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
      footerExtra: ' upon registration, invite peers for more!',
      items: [],
    },
    footer: {
      contact: 'Contact',
      rights: '© 2024 Peng Ge. All rights reserved.',
      ctaTitle: 'Ready to ',
      ctaTitleHighlight: 'Start Your IP Journey',
      ctaTitleEnd: '?',
      ctaSubtitle: 'Whether you want to build a personal brand or explore AI tools, I am here to help.',
      sendEmail: 'Email Me',
      addWechat: 'Add WeChat',
      brandDescription: 'Focus on Medical IP Incubation & AI Efficiency Tools.',
      quickLinks: 'Quick Links',
      contactInfo: 'Contact',
      email: 'Email',
      wechat: 'WeChat',
      redNote: 'RedNote',
      redNoteStats: '50k+ Followers',
      viewProfile: 'View Profile',
      scanWechat: 'Scan WeChat',
      scanHint: 'Remark "IP Consult"',
      copyright: '© {year} Peng Ge IP & AI Platform',
      madeWith: 'Made with',
      inChina: 'in China',
    },
  },
};
