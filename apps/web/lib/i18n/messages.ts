export type Locale = 'zh' | 'en'

export interface Messages {
  nav: {
    overview: string
    workspace: string
    chat: string
    agents: string
    agentOverview: string
    projects: string
    channels: string
    resources: string
    knowledge: string
    memory: string
    plugins: string
    operations: string
    monitoring: string
    scheduler: string
    settings: string
  }
  topbar: {
    searchPlaceholder: string
    notifications: string
    profile: string
    orgSettings: string
    logout: string
  }
  auth: {
    login: string
    loginWithEmail: string
    loginWithPhone: string
    email: string
    phone: string
    password: string
    loginError: string
    loginButton: string
    thirdPartyLogin: string
    loginWithGithub: string
    loginWithGoogle: string
    loginWithApple: string
    loginWithWechat: string
    forgotPassword: string
    noAccount: string
    signUp: string
  }
  common: {
    save: string
    cancel: string
    confirm: string
    delete: string
    edit: string
    create: string
    search: string
    loading: string
    noData: string
    retry: string
    back: string
    close: string
    next: string
    previous: string
    submit: string
    reset: string
    export: string
    import: string
    refresh: string
    enabled: string
    disabled: string
    active: string
    inactive: string
  }
  chat: {
    newSession: string
    selectOrCreate: string
    messageCount: string
    agentStatus: string
    running: string
    idle: string
    recentActivity: string
  }
  dashboard: {
    welcome: string
    activeAgents: string
    todaySessions: string
    tokenUsage: string
    completedTasks: string
  }
  error: {
    pageError: string
    loadFailed: string
    unknown: string
  }
}

export const zh: Messages = {
  nav: {
    overview: '概览',
    workspace: '工作区',
    chat: '对话',
    agents: 'Agent',
    agentOverview: '协作概览',
    projects: '项目',
    channels: '频道',
    resources: '资源',
    knowledge: '知识库',
    memory: '记忆',
    plugins: '插件',
    operations: '运维',
    monitoring: '监控',
    scheduler: '调度',
    settings: '设置',
  },
  topbar: {
    searchPlaceholder: '搜索... (⌘K)',
    notifications: '通知',
    profile: '个人设置',
    orgSettings: '组织设置',
    logout: '退出登录',
  },
  auth: {
    login: '登录',
    loginWithEmail: '邮箱登录',
    loginWithPhone: '手机登录',
    email: '邮箱地址',
    phone: '手机号码',
    password: '密码',
    loginError: '登录失败，请稍后重试',
    loginButton: '登录 →',
    thirdPartyLogin: '第三方账号登录',
    loginWithGithub: 'GitHub 登录',
    loginWithGoogle: 'Google 登录',
    loginWithApple: 'Apple 登录',
    loginWithWechat: '微信登录',
    forgotPassword: '忘记密码？',
    noAccount: '还没有账号？',
    signUp: '立即注册',
  },
  common: {
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    search: '搜索',
    loading: '加载中...',
    noData: '暂无数据',
    retry: '重试',
    back: '返回',
    close: '关闭',
    next: '下一步',
    previous: '上一步',
    submit: '提交',
    reset: '重置',
    export: '导出',
    import: '导入',
    refresh: '刷新',
    enabled: '已启用',
    disabled: '已禁用',
    active: '活跃',
    inactive: '非活跃',
  },
  chat: {
    newSession: '新对话',
    selectOrCreate: '选择或新建对话',
    messageCount: '条消息',
    agentStatus: 'Agent 状态',
    running: '运行中',
    idle: '待机',
    recentActivity: '最近活动',
  },
  dashboard: {
    welcome: '欢迎回来',
    activeAgents: '活跃 Agent',
    todaySessions: '今日会话',
    tokenUsage: 'Token 用量',
    completedTasks: '已完成任务',
  },
  error: {
    pageError: '页面发生错误',
    loadFailed: '页面加载失败',
    unknown: '发生未知错误，请重试或返回主页',
  },
}

export const en: Messages = {
  nav: {
    overview: 'Overview',
    workspace: 'Workspace',
    chat: 'Chat',
    agents: 'Agents',
    agentOverview: 'Agent Overview',
    projects: 'Projects',
    channels: 'Channels',
    resources: 'Resources',
    knowledge: 'Knowledge',
    memory: 'Memory',
    plugins: 'Plugins',
    operations: 'Operations',
    monitoring: 'Monitoring',
    scheduler: 'Scheduler',
    settings: 'Settings',
  },
  topbar: {
    searchPlaceholder: 'Search... (⌘K)',
    notifications: 'Notifications',
    profile: 'Profile',
    orgSettings: 'Org Settings',
    logout: 'Log out',
  },
  auth: {
    login: 'Login',
    loginWithEmail: 'Email',
    loginWithPhone: 'Phone',
    email: 'Email address',
    phone: 'Phone number',
    password: 'Password',
    loginError: 'Login failed, please try again.',
    loginButton: 'Sign in →',
    thirdPartyLogin: 'Or continue with',
    loginWithGithub: 'GitHub',
    loginWithGoogle: 'Google',
    loginWithApple: 'Apple',
    loginWithWechat: 'WeChat',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',
  },
  common: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    loading: 'Loading...',
    noData: 'No data',
    retry: 'Retry',
    back: 'Back',
    close: 'Close',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
    enabled: 'Enabled',
    disabled: 'Disabled',
    active: 'Active',
    inactive: 'Inactive',
  },
  chat: {
    newSession: 'New chat',
    selectOrCreate: 'Select or create a chat',
    messageCount: 'messages',
    agentStatus: 'Agent Status',
    running: 'Running',
    idle: 'Idle',
    recentActivity: 'Recent Activity',
  },
  dashboard: {
    welcome: 'Welcome back',
    activeAgents: 'Active Agents',
    todaySessions: "Today's Sessions",
    tokenUsage: 'Token Usage',
    completedTasks: 'Completed Tasks',
  },
  error: {
    pageError: 'Page error',
    loadFailed: 'Failed to load page',
    unknown: 'An unknown error occurred. Please retry or go home.',
  },
}

export const messages: Record<Locale, Messages> = { zh, en }
