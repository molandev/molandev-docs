export default {
  title: 'MolanDev',
  description: '一套代码，单体与微服务自由切换',
  base: '/',
  lang: 'zh-CN',

  // 忽略死链接检测
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'alternate icon', href: '/logo.svg', type: 'image/svg+xml' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: '预览', link: 'https://preview.molandev.com' },
      { text: '框架文档', link: '/framework/guide/introduction' },
      { text: '应用文档', link: '/cloud/guide/introduction' },
      { text: '知识检索', link: '/knowledge/introduction' },
      { text: '文档转换服务', link: '/converter/overview' },
    ],

    sidebar: {
      // ========== 框架文档 ==========
      '/framework/': [
        {
          text: '指南',
          items: [
            { text: '框架介绍', link: '/framework/guide/introduction' }
          ]
        },
        {
          text: 'Util 工具类',
          collapsed: true,
          items: [
            { text: '概览', link: '/framework/modules/util/overview' },
            {
              text: '加密工具',
              collapsed: false,
              items: [
                { text: 'AES 加密', link: '/framework/modules/util/encrypt/aes' },
                { text: 'RSA 加密', link: '/framework/modules/util/encrypt/rsa' },
                { text: 'MD5 工具', link: '/framework/modules/util/encrypt/md5' },
                { text: 'SHA 工具', link: '/framework/modules/util/encrypt/sha' },
                { text: 'DES 加密', link: '/framework/modules/util/encrypt/des' },
                { text: 'Base64 工具', link: '/framework/modules/util/encrypt/base64' },
                { text: '敏感信息脱敏', link: '/framework/modules/util/encrypt/sensitive' },
                { text: '十六进制转换', link: '/framework/modules/util/encrypt/hex' }
              ]
            },
            {
              text: '通用工具',
              collapsed: false,
              items: [
                { text: '字符串工具', link: '/framework/modules/util/common/string' },
                { text: '日期工具', link: '/framework/modules/util/common/date' },
                { text: '文件工具', link: '/framework/modules/util/common/file' },
                { text: 'IO 工具', link: '/framework/modules/util/common/io' },
                { text: '集合工具', link: '/framework/modules/util/common/collection' },
                { text: '数学工具', link: '/framework/modules/util/common/math' },
                { text: '随机数工具', link: '/framework/modules/util/common/random' },
                { text: 'ID 生成', link: '/framework/modules/util/common/id' },
                { text: '类操作工具', link: '/framework/modules/util/common/class' },
                { text: '校验工具', link: '/framework/modules/util/common/validator' },
                { text: '压缩工具', link: '/framework/modules/util/common/gzip' },
                { text: '双重检查', link: '/framework/modules/util/common/double-check' },
                { text: '线程工具', link: '/framework/modules/util/common/thread' },
                { text: '系统命令工具', link: '/framework/modules/util/common/command' }
              ]
            }
          ]
        },
        {
          text: 'Spring 集成',
          collapsed: true,
          items: [
            { text: '概览', link: '/framework/modules/spring/overview' },
            { text: '快速开始', link: '/framework/modules/spring/getting-started' },
            { text: 'JSON 工具', link: '/framework/modules/spring/json' },
            { text: '任务调度工具', link: '/framework/modules/spring/task' },
            { text: '树形结构工具', link: '/framework/modules/spring/tree' },
            { text: 'Spring 工具', link: '/framework/modules/spring/spring' },
            { text: 'UserAgent 工具', link: '/framework/modules/spring/user-agent' },
            { text: 'XSS 防护', link: '/framework/modules/spring/xss' },
            { text: 'JSON 配置', link: '/framework/modules/spring/json-config' }
          ]
        },
        {
          text: 'Encrypt 加密',
          collapsed: true,
          items: [
            { text: '概览', link: '/framework/modules/encrypt/overview' },
            { text: '快速开始', link: '/framework/modules/encrypt/getting-started' },
            { text: '数据库字段加密', link: '/framework/modules/encrypt/db-encrypt' },
            { text: '请求参数加密', link: '/framework/modules/encrypt/param-encrypt' },
            { text: '混合加密通信', link: '/framework/modules/encrypt/hybrid-encrypt' },
            { text: '签名校验', link: '/framework/modules/encrypt/sign' },
            { text: '敏感信息脱敏', link: '/framework/modules/encrypt/sensitive' }
          ]
        },
        {
          text: 'Lock 分布式锁',
          collapsed: true,
          items: [
            { text: '概览', link: '/framework/modules/lock/overview' },
            { text: '快速开始', link: '/framework/modules/lock/getting-started' },
            { text: '注解式使用', link: '/framework/modules/lock/annotation' },
            { text: '编程式使用', link: '/framework/modules/lock/programming' },
            { text: '底层实现原理', link: '/framework/modules/lock/implementation' }
          ]
        },
        {
          text: 'Datasource 多数据源',
          collapsed: true,
          items: [
            { text: '概览', link: '/framework/modules/datasource/overview' },
            { text: '快速开始', link: '/framework/modules/datasource/getting-started' },
            { text: '连接池配置', link: '/framework/modules/datasource/pool-config' },
            { text: '事务管理', link: '/framework/modules/datasource/transaction' }
          ]
        },
        {
          text: 'File 文件存储',
          link: '/framework/modules/file/'
        },
        {
          text: 'Event 事件',
          link: '/framework/modules/event'
        },
        {
          text: 'RPC 远程调用',
          link: '/framework/modules/rpc'
        }
      ],

      // ========== 应用文档 ==========
      '/cloud/': [
        {
          text: '快速开始',
          items: [
            { text: '项目介绍', link: '/cloud/guide/introduction' },
            { text: '快速启动', link: '/cloud/guide/quick-start' },
            // { text: '架构切换演示', link: '/cloud/guide/dual-mode-demo' }
          ]
        },

        {
          text: '后端介绍',
          collapsed: false,
          items: [
            { text: '技术选型', link: '/cloud/backend/tech-stack' },
            { text: '项目结构', link: '/cloud/backend/structure' },
            { text: '开发规范', link: '/cloud/backend/specification' },
            { text: '代码生成器', link: '/cloud/backend/code-generator' },
            { text: '字典管理', link: '/cloud/backend/features/dict' },
            { text: '操作日志', link: '/cloud/backend/features/log' },
            { text: '定时任务', link: '/cloud/backend/features/job' },
            { text: '消息服务', link: '/cloud/backend/features/message' },
            { text: '文件管理', link: '/cloud/backend/features/file' },
          ]
        },
        {
          text: '前端介绍',
          collapsed: false,
          items: [
            { text: '技术选型', link: '/cloud/frontend/tech-stack' },
            { text: '主题系统', link: '/cloud/frontend/theme' },
            { text: '布局系统', link: '/cloud/frontend/layout' },
            { text: '标签页系统', link: '/cloud/frontend/tags-view' },
            { text: '权限控制', link: '/cloud/frontend/permission' },
            { text: '业务组件', link: '/cloud/frontend/components' }
          ]
        },
        {
          text: '认证授权',
          collapsed: false,
          items: [
            { text: 'RBAC权限模型', link: '/cloud/backend/auth/rbac' },
            { text: '网关权限', link: '/cloud/backend/auth/gateway' },
            { text: '登录策略', link: '/cloud/backend/auth/login' },
            { text: '账户策略', link: '/cloud/backend/auth/account' }
          ]
        },
        // {
        //   text: '部署运维',
        //   collapsed: true,
        //   items: [
        //     { text: '单体部署', link: '/cloud/deployment/monolith' },
        //     { text: '微服务部署', link: '/cloud/deployment/microservice' },
        //     { text: '监控运维', link: '/cloud/deployment/monitoring' },
        //     { text: '性能优化', link: '/cloud/deployment/optimization' }
        //   ]
        // },

      ],

      // ========== Knowledge 服务 ==========
      '/knowledge/': [
        {
          text: '指南',
          items: [
            { text: '项目介绍', link: '/knowledge/introduction' }
          ]
        },
        {
          text: '核心功能',
          collapsed: false,
          items: [
            { text: '文档摄入', link: '/knowledge/ingest' },
            { text: '检索系统', link: '/knowledge/retrieval' },
            { text: 'RAG 问答', link: '/knowledge/rag' },
            { text: '配置说明', link: '/knowledge/config' }
          ]
        }
      ]

    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/molandev/molandev-cloud' },
      {
        icon: {
          svg: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.984 0A12 12 0 0 0 0 12 12 12 0 0 0 12 24a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.327 0 .593-.265.593-.593v-1.481a.593.593 0 0 0-.593-.593h-3.556a.593.593 0 0 1-.593-.593V9.778c0-.327.266-.593.593-.593h5.926c.327 0 .593.266.593.593v6.815a2.37 2.37 0 0 1-2.37 2.37H6.518a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.444-4.445h7.705z"/></svg>'
        },
        link: 'https://gitee.com/molandev/molandev-cloud'
      }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present MolanDev | <a href="https://beian.miit.gov.cn/" target="_blank">豫ICP备2025140146号-2</a>'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: '页面导航'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    }
  }
}
