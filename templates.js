/* ArchForm(架构表单) 预置模板库
 * 说明:模板为纯数据(与编辑器解耦),按相同 JSON 结构增删即可扩展;
 * 内容为中性占位,不含具体产品/公司信息,产品名使用"API网关"等通用词。
 * 每个模板带 schemaVersion,加载时经 migrateDiagram 迁移/兜底。 */
window.ARCH_TEMPLATES = {

 /* ============ 1. 通用分层架构(能力上限演示) ============ */
 "logical": {
  "id": "n2033",
  "schemaVersion": 1,
  "title": "通用分层架构",
  "subtitle": "通用分层架构示例（层 → 分组 → 模块 → 功能条目）",
  "layout": "layered",
  "legend": [
   { "id": "n2034", "color": "#2379bd", "title": "业务应用层" },
   { "id": "n2035", "color": "#1a5c94", "title": "平台能力层" },
   { "id": "n2036", "color": "#143c66", "title": "数据资源层" }
  ],
  "layers": [
   {
    "id": "n2055",
    "name": "业务应用层",
    "bandColor": "#2379bd",
    "cols": 3,
    "stat": "15模块 · 46项功能",
    "groups": [
     {
      "id": "n2041",
      "title": "分组一",
      "blocks": [
       { "id": "n2037", "title": "模块一", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2038", "title": "模块二", "items": ["功能条目一", "功能条目二"] },
       { "id": "n2039", "title": "模块三", "items": ["功能条目一", "功能条目二", "功能条目三", "功能条目四"] },
       { "id": "n2040", "title": "模块四", "items": ["功能条目一", "功能条目二"] }
      ]
     },
     {
      "id": "n2047",
      "title": "分组二",
      "blocks": [
       { "id": "n2042", "title": "模块一", "items": ["功能条目一", "功能条目二", "功能条目三", "功能条目四"] },
       { "id": "n2043", "title": "模块二", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2044", "title": "模块三", "items": ["功能条目一", "功能条目二"] },
       { "id": "n2045", "title": "模块四", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2046", "title": "模块五", "items": ["功能条目一", "功能条目二"] }
      ]
     },
     {
      "id": "n2054",
      "title": "分组三",
      "blocks": [
       { "id": "n2048", "title": "模块一", "items": ["功能条目一", "功能条目二"] },
       { "id": "n2049", "title": "模块二", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2050", "title": "模块三", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2051", "title": "模块四", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2052", "title": "模块五", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2053", "title": "模块六", "items": ["功能条目一", "功能条目二"] }
      ]
     }
    ]
   },
   {
    "id": "n2071",
    "name": "平台能力层",
    "bandColor": "#1a5c94",
    "cols": 3,
    "stat": "12模块 · 34项功能",
    "groups": [
     {
      "id": "n2060",
      "title": "分组一",
      "blocks": [
       { "id": "n2056", "title": "模块一", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2057", "title": "模块二", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2058", "title": "模块三", "items": ["功能条目一", "功能条目二"] },
       { "id": "n2059", "title": "模块四", "items": ["功能条目一", "功能条目二", "功能条目三"] }
      ]
     },
     {
      "id": "n2065",
      "title": "分组二",
      "blocks": [
       { "id": "n2061", "title": "模块一", "items": ["功能条目一", "功能条目二"] },
       { "id": "n2062", "title": "模块二", "items": ["功能条目一", "功能条目二", "功能条目三", "功能条目四"] },
       { "id": "n2063", "title": "模块三", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2064", "title": "模块四", "items": ["功能条目一", "功能条目二", "功能条目三"] }
      ]
     },
     {
      "id": "n2070",
      "title": "分组三",
      "blocks": [
       { "id": "n2066", "title": "模块一", "items": ["功能条目一", "功能条目二"] },
       { "id": "n2067", "title": "模块二", "items": ["功能条目一", "功能条目二"] },
       { "id": "n2068", "title": "模块三", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2069", "title": "模块四", "items": ["功能条目一", "功能条目二", "功能条目三"] }
      ]
     }
    ]
   },
   {
    "id": "n2083",
    "name": "数据资源层",
    "bandColor": "#143c66",
    "cols": 3,
    "stat": "9模块 · 20项功能",
    "groups": [
     {
      "id": "n2076",
      "title": "分组一",
      "blocks": [
       { "id": "n2072", "title": "模块一", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2073", "title": "模块二", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2074", "title": "模块三", "items": ["功能条目一", "功能条目二"] },
       { "id": "n2075", "title": "模块四", "items": ["功能条目一", "功能条目二", "功能条目三"] }
      ]
     },
     {
      "id": "n2082",
      "title": "分组二",
      "blocks": [
       { "id": "n2077", "title": "模块一", "items": ["功能条目一", "功能条目二"] },
       { "id": "n2078", "title": "模块二", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2079", "title": "模块三", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2080", "title": "模块四", "items": ["功能条目一", "功能条目二", "功能条目三"] },
       { "id": "n2081", "title": "模块五", "items": ["功能条目一", "功能条目二"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 2. 系统总体架构图(分层总体架构) ============ */
 "overall": {
  "id": "ov-1",
  "schemaVersion": 1,
  "title": "系统总体架构图",
  "subtitle": "用户接入 → 业务应用 → 平台能力 → 数据资源 → 基础设施（安全 / 运维贯穿）",
  "layout": "layered",
  "sidebar": [
   { "id": "ov-s1", "title": "安全保障体系", "color": "#0e2a47", "items": ["安全管理制度", "等级保护合规", "应急响应预案", "安全审计追踪"] },
   { "id": "ov-s2", "title": "运维管理体系", "color": "#1a5c94", "items": ["监控告警", "容量管理", "变更管理", "容灾演练"] }
  ],
  "legend": [
   { "id": "ov-l1", "color": "#2f80c2", "title": "用户接入层" },
   { "id": "ov-l2", "color": "#2379bd", "title": "业务应用层" },
   { "id": "ov-l3", "color": "#1a5c94", "title": "平台能力层" },
   { "id": "ov-l4", "color": "#143c66", "title": "数据资源层" },
   { "id": "ov-l5", "color": "#0e2a47", "title": "基础设施层" }
  ],
  "layers": [
   {
    "id": "ov-2",
    "name": "用户接入层",
    "bandColor": "#2f80c2",
    "cols": 2,
    "stat": "5 个接入渠道 · 4 类外部接入",
    "groups": [
     {
      "id": "ov-g1",
      "title": "终端接入",
      "blocks": [
       { "id": "ov-b1", "title": "统一门户", "items": ["员工门户", "客户门户", "合作伙伴门户"] },
       { "id": "ov-b2", "title": "移动端", "items": ["移动办公", "移动业务办理", "消息推送"] },
       { "id": "ov-b3", "title": "自助与大屏", "items": ["自助终端", "管理驾驶舱", "大屏展示"] }
      ]
     },
     {
      "id": "ov-g2",
      "title": "外部接入",
      "blocks": [
       { "id": "ov-b4", "title": "第三方系统", "items": ["合作机构系统", "监管报送系统", "支付渠道"] },
       { "id": "ov-b5", "title": "开放能力", "items": ["开放API", "开发者平台", "数据交换接口"] }
      ]
     }
    ]
   },
   {
    "id": "ov-3",
    "name": "业务应用层",
    "bandColor": "#2379bd",
    "cols": 3,
    "stat": "12 个应用系统 · 9 大业务域",
    "groups": [
     {
      "id": "ov-g3",
      "title": "经营管理域",
      "blocks": [
       { "id": "ov-b6", "title": "预算管理", "items": ["预算编制", "预算执行", "预算分析"] },
       { "id": "ov-b7", "title": "绩效管理", "items": ["指标设定", "过程跟踪", "考核评价"] },
       { "id": "ov-b8", "title": "风险管控", "items": ["风险识别", "风险预警", "合规审查"] }
      ]
     },
     {
      "id": "ov-g4",
      "title": "业务运营域",
      "blocks": [
       { "id": "ov-b9", "title": "客户管理", "items": ["客户档案", "客户分级", "客户洞察"] },
       { "id": "ov-b10", "title": "营销活动", "items": ["活动策划", "活动执行", "效果评估"] },
       { "id": "ov-b11", "title": "订单管理", "items": ["订单受理", "订单流转", "订单查询"] }
      ]
     },
     {
      "id": "ov-g5",
      "title": "公共服务域",
      "blocks": [
       { "id": "ov-b12", "title": "统一认证", "items": ["单点登录", "统一授权", "身份治理"] },
       { "id": "ov-b13", "title": "消息中心", "items": ["站内消息", "短信通知", "邮件通知"] },
       { "id": "ov-b14", "title": "流程中心", "items": ["流程设计", "流程审批", "流程监控"] }
      ]
     }
    ]
   },
   {
    "id": "ov-4",
    "name": "平台能力层",
    "bandColor": "#1a5c94",
    "cols": 3,
    "stat": "11 个平台组件 · 30+ 项能力",
    "groups": [
     {
      "id": "ov-g6",
      "title": "技术平台",
      "blocks": [
       { "id": "ov-b15", "title": "微服务框架", "items": ["服务注册", "服务发现", "负载均衡"] },
       { "id": "ov-b16", "title": "容器平台", "items": ["容器编排", "弹性伸缩", "镜像管理"] },
       { "id": "ov-b17", "title": "API网关", "items": ["路由转发", "鉴权限流", "灰度发布"] }
      ]
     },
     {
      "id": "ov-g7",
      "title": "业务中台",
      "blocks": [
       { "id": "ov-b18", "title": "用户中心", "items": ["用户模型", "实名认证", "账户管理"] },
       { "id": "ov-b19", "title": "订单中心", "items": ["订单模型", "订单状态机", "订单履约"] },
       { "id": "ov-b20", "title": "支付中心", "items": ["支付渠道", "对账清算", "退款管理"] },
       { "id": "ov-b21", "title": "商品中心", "items": ["商品模型", "价格体系", "库存管理"] }
      ]
     },
     {
      "id": "ov-g8",
      "title": "数据中台",
      "blocks": [
       { "id": "ov-b22", "title": "数据汇聚", "items": ["离线采集", "实时接入", "数据同步"] },
       { "id": "ov-b23", "title": "数据开发", "items": ["数据建模", "任务调度", "质量稽核"] },
       { "id": "ov-b24", "title": "数据服务", "items": ["指标服务", "标签服务", "数据API"] }
      ]
     }
    ]
   },
   {
    "id": "ov-5",
    "name": "数据资源层",
    "bandColor": "#143c66",
    "cols": 2,
    "stat": "4 类数据资产 · 200+ 数据模型",
    "groups": [
     {
      "id": "ov-g9",
      "title": "数据湖",
      "blocks": [
       { "id": "ov-b25", "title": "贴源数据", "items": ["业务原始数据", "日志原始数据"] },
       { "id": "ov-b26", "title": "流式数据", "items": ["实时事件流", "指标流"] }
      ]
     },
     {
      "id": "ov-g10",
      "title": "数据仓库",
      "blocks": [
       { "id": "ov-b27", "title": "明细层", "items": ["客户明细", "交易明细"] },
       { "id": "ov-b28", "title": "汇总层", "items": ["经营汇总", "渠道汇总"] },
       { "id": "ov-b29", "title": "应用层", "items": ["主题宽表", "报表集市"] }
      ]
     },
     {
      "id": "ov-g11",
      "title": "主数据",
      "blocks": [
       { "id": "ov-b30", "title": "客户主数据", "items": ["客户唯一标识", "客户属性"] },
       { "id": "ov-b31", "title": "组织主数据", "items": ["组织架构", "岗位人员"] },
       { "id": "ov-b32", "title": "产品主数据", "items": ["产品目录", "产品属性"] }
      ]
     }
    ]
   },
   {
    "id": "ov-6",
    "name": "基础设施层",
    "bandColor": "#0e2a47",
    "cols": 3,
    "stat": "云平台 · 安全防护 · 运行支撑",
    "groups": [
     {
      "id": "ov-g12",
      "title": "云平台",
      "blocks": [
       { "id": "ov-b33", "title": "计算资源", "items": ["虚拟机", "容器节点", "GPU集群"] },
       { "id": "ov-b34", "title": "存储资源", "items": ["块存储", "文件存储", "对象存储"] },
       { "id": "ov-b35", "title": "网络资源", "items": ["VPC", "负载均衡", "专线连接"] }
      ]
     },
     {
      "id": "ov-g13",
      "title": "安全防护",
      "blocks": [
       { "id": "ov-b36", "title": "边界防护", "items": ["防火墙", "入侵检测", "防病毒"] },
       { "id": "ov-b37", "title": "数据安全", "items": ["数据加密", "脱敏水印", "访问审计"] }
      ]
     },
     {
      "id": "ov-g14",
      "title": "运行支撑",
      "blocks": [
       { "id": "ov-b38", "title": "机房设施", "items": ["供电制冷", "网络布线"] },
       { "id": "ov-b39", "title": "灾备中心", "items": ["同城双活", "异地备份", "容灾演练"] },
       { "id": "ov-b40", "title": "监控告警", "items": ["资源监控", "应用监控", "告警通知"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 3. 应用架构图 ============ */
 "application": {
  "id": "ap-1",
  "schemaVersion": 1,
  "title": "应用架构图",
  "subtitle": "应用系统模块划分与功能组成（门户 → 核心应用 → 公共服务 → 基础支撑）",
  "layout": "layered",
  "sidebar": [
   { "id": "ap-s1", "title": "非功能要求", "color": "#1a5c94", "items": ["性能：核心交易响应 < 1 秒", "可用性：关键系统 99.9%", "安全：等保三级", "可维护性：统一日志与监控"] }
  ],
  "legend": [
   { "id": "ap-l1", "color": "#2f80c2", "title": "前端门户层" },
   { "id": "ap-l2", "color": "#2379bd", "title": "核心应用层" },
   { "id": "ap-l3", "color": "#1a5c94", "title": "公共服务层" },
   { "id": "ap-l4", "color": "#143c66", "title": "基础支撑层" }
  ],
  "layers": [
   {
    "id": "ap-2",
    "name": "前端门户层",
    "bandColor": "#2f80c2",
    "cols": 2,
    "stat": "3 类门户 · 4 个移动应用",
    "groups": [
     {
      "id": "ap-g1",
      "title": "统一门户",
      "blocks": [
       { "id": "ap-b1", "title": "员工门户", "items": ["待办中心", "信息发布", "个人工作台"] },
       { "id": "ap-b2", "title": "客户门户", "items": ["自助服务", "在线咨询", "业务办理"] },
       { "id": "ap-b3", "title": "管理驾驶舱", "items": ["经营看板", "风险看板", "专题分析"] }
      ]
     },
     {
      "id": "ap-g2",
      "title": "移动端",
      "blocks": [
       { "id": "ap-b4", "title": "移动办公", "items": ["审批流转", "通讯录", "日程"] },
       { "id": "ap-b5", "title": "移动业务", "items": ["业务受理", "现场拍照", "进度跟踪"] },
       { "id": "ap-b6", "title": "消息推送", "items": ["业务提醒", "待办提醒", "公告推送"] }
      ]
     }
    ]
   },
   {
    "id": "ap-3",
    "name": "核心应用层",
    "bandColor": "#2379bd",
    "cols": 3,
    "stat": "9 个核心应用 · 30+ 业务功能",
    "groups": [
     {
      "id": "ap-g3",
      "title": "营销域",
      "blocks": [
       { "id": "ap-b7", "title": "活动管理", "items": ["活动配置", "活动投放", "活动监测"] },
       { "id": "ap-b8", "title": "线索管理", "items": ["线索采集", "线索分配", "线索转化"] },
       { "id": "ap-b9", "title": "渠道管理", "items": ["渠道台账", "渠道考核", "渠道结算"] }
      ]
     },
     {
      "id": "ap-g4",
      "title": "交易域",
      "blocks": [
       { "id": "ap-b10", "title": "订单管理", "items": ["订单受理", "订单履约", "订单查询"] },
       { "id": "ap-b11", "title": "合同管理", "items": ["合同起草", "合同审批", "合同归档"] },
       { "id": "ap-b12", "title": "支付结算", "items": ["收款管理", "结算对账", "退款处理"] }
      ]
     },
     {
      "id": "ap-g5",
      "title": "服务域",
      "blocks": [
       { "id": "ap-b13", "title": "工单管理", "items": ["工单创建", "工单派发", "工单回访"] },
       { "id": "ap-b14", "title": "客户服务", "items": ["服务受理", "服务记录", "满意度调查"] },
       { "id": "ap-b15", "title": "投诉处理", "items": ["投诉登记", "处理跟踪", "结果反馈"] }
      ]
     }
    ]
   },
   {
    "id": "ap-4",
    "name": "公共服务层",
    "bandColor": "#1a5c94",
    "cols": 2,
    "stat": "5 个基础服务 · 3 个集成服务",
    "groups": [
     {
      "id": "ap-g6",
      "title": "基础服务",
      "blocks": [
       { "id": "ap-b16", "title": "统一认证", "items": ["单点登录", "统一授权", "密码策略"] },
       { "id": "ap-b17", "title": "组织权限", "items": ["组织模型", "岗位权限", "数据权限"] },
       { "id": "ap-b18", "title": "消息中心", "items": ["消息模板", "多渠道发送", "送达回执"] },
       { "id": "ap-b19", "title": "流程引擎", "items": ["流程建模", "流程实例", "流程监控"] }
      ]
     },
     {
      "id": "ap-g7",
      "title": "集成服务",
      "blocks": [
       { "id": "ap-b20", "title": "接口网关", "items": ["接口注册", "协议转换", "调用审计"] },
       { "id": "ap-b21", "title": "数据交换", "items": ["文件交换", "库表同步", "接口对接"] },
       { "id": "ap-b22", "title": "文件服务", "items": ["文件上传", "文件预览", "权限控制"] }
      ]
     }
    ]
   },
   {
    "id": "ap-5",
    "name": "基础支撑层",
    "bandColor": "#143c66",
    "cols": 2,
    "stat": "运行支撑 · 数据支撑",
    "groups": [
     {
      "id": "ap-g8",
      "title": "运行支撑",
      "blocks": [
       { "id": "ap-b23", "title": "应用监控", "items": ["指标监控", "告警规则", "健康检查"] },
       { "id": "ap-b24", "title": "日志中心", "items": ["日志采集", "日志检索", "日志审计"] },
       { "id": "ap-b25", "title": "配置中心", "items": ["配置管理", "灰度发布", "配置回滚"] }
      ]
     },
     {
      "id": "ap-g9",
      "title": "数据支撑",
      "blocks": [
       { "id": "ap-b26", "title": "报表平台", "items": ["报表制作", "报表订阅", "报表导出"] },
       { "id": "ap-b27", "title": "数据同步", "items": ["库表同步", "消息同步", "增量处理"] },
       { "id": "ap-b28", "title": "备份恢复", "items": ["自动备份", "异地备份", "恢复演练"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 4. 数据架构图(数仓分层) ============ */
 "data": {
  "id": "da-1",
  "schemaVersion": 1,
  "title": "数据架构图",
  "subtitle": "数据分层与主题域（数据源 → 贴源 → 明细 → 汇总 → 应用 → 服务）",
  "layout": "layered",
  "sidebar": [
   { "id": "da-s1", "title": "数据治理体系", "color": "#081c33", "items": ["数据标准", "数据质量", "数据安全", "主数据管理", "元数据管理"] }
  ],
  "legend": [
   { "id": "da-l1", "color": "#2f80c2", "title": "数据源层" },
   { "id": "da-l2", "color": "#2379bd", "title": "ODS 贴源层" },
   { "id": "da-l3", "color": "#1a5c94", "title": "DWD 明细层" },
   { "id": "da-l4", "color": "#143c66", "title": "DWS 汇总层" },
   { "id": "da-l5", "color": "#0e2a47", "title": "ADS 应用层" },
   { "id": "da-l6", "color": "#081c33", "title": "数据服务层" }
  ],
  "layers": [
   {
    "id": "da-2",
    "name": "数据源层",
    "bandColor": "#2f80c2",
    "cols": 3,
    "stat": "30+ 数据源",
    "groups": [
     {
      "id": "da-g1",
      "title": "业务系统",
      "blocks": [
       { "id": "da-b1", "title": "交易系统", "items": ["订单数据", "支付数据"] },
       { "id": "da-b2", "title": "营销系统", "items": ["活动数据", "渠道数据"] },
       { "id": "da-b3", "title": "客服系统", "items": ["工单数据", "会话数据"] }
      ]
     },
     {
      "id": "da-g2",
      "title": "外部数据",
      "blocks": [
       { "id": "da-b4", "title": "合作机构", "items": ["交易流水", "结算文件"] },
       { "id": "da-b5", "title": "监管报送", "items": ["监管报表", "报文数据"] },
       { "id": "da-b6", "title": "行业数据", "items": ["市场行情", "行业指标"] }
      ]
     },
     {
      "id": "da-g3",
      "title": "日志数据",
      "blocks": [
       { "id": "da-b7", "title": "访问日志", "items": ["页面访问", "接口调用"] },
       { "id": "da-b8", "title": "操作日志", "items": ["业务操作", "管理操作"] },
       { "id": "da-b9", "title": "监控日志", "items": ["应用日志", "系统日志"] }
      ]
     }
    ]
   },
   {
    "id": "da-3",
    "name": "ODS 贴源层",
    "bandColor": "#2379bd",
    "cols": 3,
    "stat": "与源系统结构一致",
    "groups": [
     {
      "id": "da-g4",
      "title": "增量采集",
      "blocks": [
       { "id": "da-b10", "title": "订单增量", "items": ["新增订单", "状态变更"] },
       { "id": "da-b11", "title": "客户增量", "items": ["新增客户", "资料变更"] }
      ]
     },
     {
      "id": "da-g5",
      "title": "全量采集",
      "blocks": [
       { "id": "da-b12", "title": "主数据全量", "items": ["客户全量", "产品全量"] },
       { "id": "da-b13", "title": "维度全量", "items": ["组织维度", "渠道维度"] }
      ]
     },
     {
      "id": "da-g6",
      "title": "日志接入",
      "blocks": [
       { "id": "da-b14", "title": "实时日志", "items": ["消息流接入", "实时解析"] },
       { "id": "da-b15", "title": "离线日志", "items": ["批量落库", "压缩归档"] }
      ]
     }
    ]
   },
   {
    "id": "da-4",
    "name": "DWD 明细层",
    "bandColor": "#1a5c94",
    "cols": 3,
    "stat": "主题域明细模型",
    "groups": [
     {
      "id": "da-g7",
      "title": "客户主题",
      "blocks": [
       { "id": "da-b16", "title": "客户明细", "items": ["客户事实表", "客户关系表"] },
       { "id": "da-b17", "title": "账户明细", "items": ["账户事实表", "账户流水表"] }
      ]
     },
     {
      "id": "da-g8",
      "title": "交易主题",
      "blocks": [
       { "id": "da-b18", "title": "订单明细", "items": ["订单事实表", "订单项明细"] },
       { "id": "da-b19", "title": "支付明细", "items": ["支付事实表", "退款明细"] }
      ]
     },
     {
      "id": "da-g9",
      "title": "产品主题",
      "blocks": [
       { "id": "da-b20", "title": "产品明细", "items": ["产品事实表", "产品属性表"] },
       { "id": "da-b21", "title": "渠道明细", "items": ["渠道事实表", "渠道事件表"] }
      ]
     }
    ]
   },
   {
    "id": "da-5",
    "name": "DWS 汇总层",
    "bandColor": "#143c66",
    "cols": 3,
    "stat": "面向分析主题汇总",
    "groups": [
     {
      "id": "da-g10",
      "title": "客户汇总",
      "blocks": [
       { "id": "da-b22", "title": "客户标签", "items": ["属性标签", "行为标签"] },
       { "id": "da-b23", "title": "客户分层", "items": ["价值分层", "风险分层"] }
      ]
     },
     {
      "id": "da-g11",
      "title": "经营汇总",
      "blocks": [
       { "id": "da-b24", "title": "销售汇总", "items": ["日销售汇总", "渠道汇总"] },
       { "id": "da-b25", "title": "渠道汇总", "items": ["渠道产能", "渠道质量"] }
      ]
     },
     {
      "id": "da-g12",
      "title": "运营汇总",
      "blocks": [
       { "id": "da-b26", "title": "活动效果", "items": ["活动参与汇总", "转化汇总"] },
       { "id": "da-b27", "title": "服务质量", "items": ["工单汇总", "满意度汇总"] }
      ]
     }
    ]
   },
   {
    "id": "da-6",
    "name": "ADS 应用层",
    "bandColor": "#0e2a47",
    "cols": 3,
    "stat": "面向场景应用",
    "groups": [
     {
      "id": "da-g13",
      "title": "管理驾驶舱",
      "blocks": [
       { "id": "da-b28", "title": "经营日报", "items": ["日报指标", "日报推送"] },
       { "id": "da-b29", "title": "风险监控", "items": ["风险指标", "异常告警"] }
      ]
     },
     {
      "id": "da-g14",
      "title": "数据分析",
      "blocks": [
       { "id": "da-b30", "title": "专题分析", "items": ["留存分析", "转化分析"] },
       { "id": "da-b31", "title": "自助分析", "items": ["即席查询", "自助报表"] }
      ]
     },
     {
      "id": "da-g15",
      "title": "报表服务",
      "blocks": [
       { "id": "da-b32", "title": "固定报表", "items": ["监管报表", "管理报表"] },
       { "id": "da-b33", "title": "移动报表", "items": ["移动看板", "推送报表"] }
      ]
     }
    ]
   },
   {
    "id": "da-7",
    "name": "数据服务层",
    "bandColor": "#081c33",
    "cols": 3,
    "stat": "统一对外数据出口",
    "groups": [
     {
      "id": "da-g16",
      "title": "数据API",
      "blocks": [
       { "id": "da-b34", "title": "指标API", "items": ["经营指标", "风险指标"] },
       { "id": "da-b35", "title": "标签API", "items": ["客户标签", "产品标签"] }
      ]
     },
     {
      "id": "da-g17",
      "title": "数据共享",
      "blocks": [
       { "id": "da-b36", "title": "内部共享", "items": ["应用取数", "分析取数"] },
       { "id": "da-b37", "title": "外部交换", "items": ["对外报送", "机构交换"] }
      ]
     },
     {
      "id": "da-g18",
      "title": "数据推送",
      "blocks": [
       { "id": "da-b38", "title": "订阅推送", "items": ["指标订阅", "报表订阅"] },
       { "id": "da-b39", "title": "实时推送", "items": ["事件推送", "流式输出"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 5. 技术架构图 ============ */
 "technology": {
  "id": "te-1",
  "schemaVersion": 1,
  "title": "技术架构图",
  "subtitle": "分层技术栈（接入 → 服务 → 中间件 → 存储 → 基础设施）",
  "layout": "layered",
  "sidebar": [
   { "id": "te-s1", "title": "技术标准与运维规范", "color": "#0e2a47", "items": ["编码规范", "接口规范", "版本规范", "上线流程", "故障预案"] }
  ],
  "legend": [
   { "id": "te-l1", "color": "#2f80c2", "title": "接入层" },
   { "id": "te-l2", "color": "#2379bd", "title": "应用服务层" },
   { "id": "te-l3", "color": "#1a5c94", "title": "中间件层" },
   { "id": "te-l4", "color": "#143c66", "title": "数据存储层" },
   { "id": "te-l5", "color": "#0e2a47", "title": "基础设施层" }
  ],
  "layers": [
   {
    "id": "te-2",
    "name": "接入层",
    "bandColor": "#2f80c2",
    "cols": 2,
    "stat": "流量接入 · 网关服务",
    "groups": [
     {
      "id": "te-g1",
      "title": "流量接入",
      "blocks": [
       { "id": "te-b1", "title": "负载均衡", "items": ["四层转发", "七层转发", "健康检查"] },
       { "id": "te-b2", "title": "域名解析", "items": ["DNS解析", "智能调度"] },
       { "id": "te-b3", "title": "内容加速", "items": ["静态加速", "动态加速"] }
      ]
     },
     {
      "id": "te-g2",
      "title": "网关服务",
      "blocks": [
       { "id": "te-b4", "title": "API网关", "items": ["路由转发", "协议转换", "灰度发布"] },
       { "id": "te-b5", "title": "鉴权过滤", "items": ["身份校验", "签名校验", "IP黑白名单"] },
       { "id": "te-b6", "title": "限流熔断", "items": ["接口限流", "熔断降级", "超时控制"] }
      ]
     }
    ]
   },
   {
    "id": "te-3",
    "name": "应用服务层",
    "bandColor": "#2379bd",
    "cols": 3,
    "stat": "业务服务 · 基础服务 · 运行载体",
    "groups": [
     {
      "id": "te-g3",
      "title": "业务服务",
      "blocks": [
       { "id": "te-b7", "title": "订单服务", "items": ["下单", "履约", "查询"] },
       { "id": "te-b8", "title": "用户服务", "items": ["注册登录", "资料管理"] },
       { "id": "te-b9", "title": "支付服务", "items": ["收单", "退款", "对账"] }
      ]
     },
     {
      "id": "te-g4",
      "title": "基础服务",
      "blocks": [
       { "id": "te-b10", "title": "认证服务", "items": ["登录认证", "令牌管理"] },
       { "id": "te-b11", "title": "权限服务", "items": ["角色权限", "数据权限"] },
       { "id": "te-b12", "title": "消息服务", "items": ["消息发送", "消息重试"] }
      ]
     },
     {
      "id": "te-g5",
      "title": "运行载体",
      "blocks": [
       { "id": "te-b13", "title": "容器编排", "items": ["服务编排", "弹性伸缩", "滚动发布"] },
       { "id": "te-b14", "title": "服务注册", "items": ["注册发现", "健康检查"] },
       { "id": "te-b15", "title": "配置中心", "items": ["配置下发", "配置回滚"] }
      ]
     }
    ]
   },
   {
    "id": "te-4",
    "name": "中间件层",
    "bandColor": "#1a5c94",
    "cols": 3,
    "stat": "消息 · 缓存 · 检索",
    "groups": [
     {
      "id": "te-g6",
      "title": "消息队列",
      "blocks": [
       { "id": "te-b16", "title": "异步解耦", "items": ["订单事件", "支付回调"] },
       { "id": "te-b17", "title": "事件驱动", "items": ["领域事件", "事件总线"] },
       { "id": "te-b18", "title": "削峰填谷", "items": ["流量缓冲", "延迟消费"] }
      ]
     },
     {
      "id": "te-g7",
      "title": "缓存服务",
      "blocks": [
       { "id": "te-b19", "title": "分布式缓存", "items": ["热点数据", "会话缓存"] },
       { "id": "te-b20", "title": "本地缓存", "items": ["字典缓存", "配置缓存"] },
       { "id": "te-b21", "title": "缓存治理", "items": ["缓存穿透防护", "缓存一致性"] }
      ]
     },
     {
      "id": "te-g8",
      "title": "检索服务",
      "blocks": [
       { "id": "te-b22", "title": "全文检索", "items": ["商品检索", "文档检索"] },
       { "id": "te-b23", "title": "日志检索", "items": ["日志索引", "关键字查询"] },
       { "id": "te-b24", "title": "指标检索", "items": ["监控指标", "趋势分析"] }
      ]
     }
    ]
   },
   {
    "id": "te-5",
    "name": "数据存储层",
    "bandColor": "#143c66",
    "cols": 3,
    "stat": "关系型 · 非关系型 · 对象存储",
    "groups": [
     {
      "id": "te-g9",
      "title": "关系型",
      "blocks": [
       { "id": "te-b25", "title": "交易库", "items": ["订单表", "账务表"] },
       { "id": "te-b26", "title": "账务库", "items": ["账户表", "流水表"] },
       { "id": "te-b27", "title": "配置库", "items": ["系统配置", "业务参数"] }
      ]
     },
     {
      "id": "te-g10",
      "title": "非关系型",
      "blocks": [
       { "id": "te-b28", "title": "文档库", "items": ["业务单据", "内容数据"] },
       { "id": "te-b29", "title": "时序库", "items": ["监控时序", "指标时序"] },
       { "id": "te-b30", "title": "图数据库", "items": ["关系网络", "血缘关系"] }
      ]
     },
     {
      "id": "te-g11",
      "title": "对象存储",
      "blocks": [
       { "id": "te-b31", "title": "文件存储", "items": ["附件文件", "图片视频"] },
       { "id": "te-b32", "title": "备份归档", "items": ["数据库备份", "日志归档"] },
       { "id": "te-b33", "title": "静态资源", "items": ["前端资源", "模板资源"] }
      ]
     }
    ]
   },
   {
    "id": "te-6",
    "name": "基础设施层",
    "bandColor": "#0e2a47",
    "cols": 3,
    "stat": "计算 · 网络 · 运维监控",
    "groups": [
     {
      "id": "te-g12",
      "title": "计算资源",
      "blocks": [
       { "id": "te-b34", "title": "虚拟机", "items": ["通用计算", "高性能计算"] },
       { "id": "te-b35", "title": "容器节点", "items": ["节点池", "资源配额"] },
       { "id": "te-b36", "title": "GPU集群", "items": ["模型训练", "推理服务"] }
      ]
     },
     {
      "id": "te-g13",
      "title": "网络资源",
      "blocks": [
       { "id": "te-b37", "title": "VPC", "items": ["子网划分", "安全组"] },
       { "id": "te-b38", "title": "负载均衡", "items": ["集群入口", "南北向流量"] },
       { "id": "te-b39", "title": "专线连接", "items": ["混合云互联", "机构专线"] }
      ]
     },
     {
      "id": "te-g14",
      "title": "运维监控",
      "blocks": [
       { "id": "te-b40", "title": "监控告警", "items": ["资源监控", "应用监控", "告警通知"] },
       { "id": "te-b41", "title": "日志平台", "items": ["日志采集", "日志检索", "日志审计"] },
       { "id": "te-b42", "title": "链路追踪", "items": ["调用链采集", "耗时分析", "错误定位"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 6. 中台架构 ============ */
 "middle": {
  "id": "mc-1",
  "schemaVersion": 2,
  "title": "中台架构",
  "subtitle": "用户接入 → 业务应用 → 共享服务中心(业务中台) → 数据中台 → 技术底座",
  "layout": "layered",
  "connections": [],
  "showConnections": false,
  "sidebar": [
   { "id": "mc-s1", "title": "治理与安全体系", "color": "#0e2a47", "items": ["服务治理规范", "数据安全策略", "接口标准化", "运维监控体系"] }
  ],
  "legend": [
   { "id": "mc-l1", "color": "#2f80c2", "title": "用户接入层" },
   { "id": "mc-l2", "color": "#2379bd", "title": "业务应用层" },
   { "id": "mc-l3", "color": "#1a5c94", "title": "共享服务中心" },
   { "id": "mc-l4", "color": "#143c66", "title": "数据中台" },
   { "id": "mc-l5", "color": "#0e2a47", "title": "技术底座" }
  ],
  "layers": [
   {
    "id": "mc-2",
    "name": "用户接入层",
    "bandColor": "#2f80c2",
    "cols": 2,
    "stat": "4 个接入渠道",
    "groups": [
     {
      "id": "mc-g1",
      "title": "终端渠道",
      "blocks": [
       { "id": "mc-b1", "title": "Web 门户", "items": ["PC 端门户", "移动端 H5", "自适应布局"] },
       { "id": "mc-b2", "title": "移动端", "items": ["原生 App", "小程序", "消息推送"] }
      ]
     },
     {
      "id": "mc-g2",
      "title": "开放渠道",
      "blocks": [
       { "id": "mc-b3", "title": "开放 API", "items": ["API 门户", "开发者中心", "SDK 管理"] },
       { "id": "mc-b4", "title": "合作伙伴", "items": ["机构接入", "数据交换", "能力输出"] }
      ]
     }
    ]
   },
   {
    "id": "mc-3",
    "name": "业务应用层",
    "bandColor": "#2379bd",
    "cols": 3,
    "stat": "6 个业务应用",
    "groups": [
     {
      "id": "mc-g3",
      "title": "前台应用",
      "blocks": [
       { "id": "mc-b5", "title": "营销活动", "items": ["活动配置", "渠道投放", "效果追踪"] },
       { "id": "mc-b6", "title": "客户服务", "items": ["工单处理", "在线客服", "满意度评价"] },
       { "id": "mc-b7", "title": "运营管理", "items": ["运营看板", "策略配置", "异常预警"] }
      ]
     },
     {
      "id": "mc-g4",
      "title": "后台应用",
      "blocks": [
       { "id": "mc-b8", "title": "供应链管理", "items": ["采购管理", "供应商管理", "物流跟踪"] },
       { "id": "mc-b9", "title": "财务管理", "items": ["应收应付", "费用报销", "财务报表"] },
       { "id": "mc-b10", "title": "人力资源", "items": ["组织管理", "考勤管理", "薪酬管理"] }
      ]
     }
    ]
   },
   {
    "id": "mc-4",
    "name": "共享服务中心",
    "bandColor": "#1a5c94",
    "cols": 4,
    "stat": "4 大服务中心",
    "groups": [
     {
      "id": "mc-g5",
      "title": "用户中心",
      "blocks": [
       { "id": "mc-b11", "title": "用户中心", "items": ["统一用户模型", "实名认证", "账户管理", "用户画像"] }
      ]
     },
     {
      "id": "mc-g6",
      "title": "订单中心",
      "blocks": [
       { "id": "mc-b12", "title": "订单中心", "items": ["统一订单模型", "订单状态机", "订单履约", "订单查询"] }
      ]
     },
     {
      "id": "mc-g7",
      "title": "商品中心",
      "blocks": [
       { "id": "mc-b13", "title": "商品中心", "items": ["统一商品模型", "品类管理", "价格体系", "库存管理"] }
      ]
     },
     {
      "id": "mc-g8",
      "title": "支付中心",
      "blocks": [
       { "id": "mc-b14", "title": "支付中心", "items": ["支付渠道", "收单能力", "对账清算", "退款管理"] }
      ]
     }
    ]
   },
   {
    "id": "mc-5",
    "name": "数据中台",
    "bandColor": "#143c66",
    "cols": 3,
    "stat": "3 大数据能力域",
    "groups": [
     {
      "id": "mc-g9",
      "title": "数据汇聚",
      "blocks": [
       { "id": "mc-b15", "title": "数据采集", "items": ["离线采集", "实时接入", "日志采集", "数据同步"] },
       { "id": "mc-b16", "title": "数据湖", "items": ["原始数据存储", "数据清洗", "数据分区"] }
      ]
     },
     {
      "id": "mc-g10",
      "title": "数据开发",
      "blocks": [
       { "id": "mc-b17", "title": "数据建模", "items": ["主题域划分", "指标体系", "维度建模"] },
       { "id": "mc-b18", "title": "数据治理", "items": ["质量稽核", "元数据管理", "数据血缘"] }
      ]
     },
     {
      "id": "mc-g11",
      "title": "数据服务",
      "blocks": [
       { "id": "mc-b19", "title": "指标服务", "items": ["经营指标", "行为指标", "实时指标"] },
       { "id": "mc-b20", "title": "标签服务", "items": ["用户标签", "行为标签", "预测标签"] }
      ]
     }
    ]
   },
   {
    "id": "mc-6",
    "name": "技术底座",
    "bandColor": "#0e2a47",
    "cols": 3,
    "stat": "4 大技术组件",
    "groups": [
     {
      "id": "mc-g12",
      "title": "微服务框架",
      "blocks": [
       { "id": "mc-b21", "title": "微服务框架", "items": ["服务注册", "服务发现", "配置管理", "负载均衡"] },
       { "id": "mc-b22", "title": "API 网关", "items": ["路由转发", "鉴权限流", "灰度发布"] }
      ]
     },
     {
      "id": "mc-g13",
      "title": "容器与编排",
      "blocks": [
       { "id": "mc-b23", "title": "容器平台", "items": ["容器编排", "弹性伸缩", "镜像管理"] },
       { "id": "mc-b24", "title": "DevOps", "items": ["持续集成", "持续部署", "发布管理"] }
      ]
     },
     {
      "id": "mc-g14",
      "title": "基础设施",
      "blocks": [
       { "id": "mc-b25", "title": "分布式存储", "items": ["块存储", "对象存储", "文件存储"] },
       { "id": "mc-b26", "title": "运维监控", "items": ["资源监控", "应用监控", "告警通知", "日志管理"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 7. 云平台架构 ============ */
 "cloud": {
  "id": "cl-1",
  "schemaVersion": 2,
  "title": "云平台架构",
  "subtitle": "接入访问 → 云管理平台 → SaaS 应用 → PaaS 平台 → IaaS 资源 → 基础设施",
  "layout": "layered",
  "connections": [],
  "showConnections": false,
  "legend": [
   { "id": "cl-l1", "color": "#2f80c2", "title": "接入访问层" },
   { "id": "cl-l2", "color": "#2379bd", "title": "云管理平台" },
   { "id": "cl-l3", "color": "#1a5c94", "title": "SaaS 应用层" },
   { "id": "cl-l4", "color": "#143c66", "title": "PaaS 平台层" },
   { "id": "cl-l5", "color": "#0e2a47", "title": "IaaS 资源层" },
   { "id": "cl-l6", "color": "#081c33", "title": "基础设施层" }
  ],
  "layers": [
   {
    "id": "cl-2",
    "name": "接入访问层",
    "bandColor": "#2f80c2",
    "cols": 2,
    "stat": "3 类接入方式",
    "groups": [
     {
      "id": "cl-g1",
      "title": "用户接入",
      "blocks": [
       { "id": "cl-b1", "title": "统一门户", "items": ["自助服务门户", "运营管理门户"] },
       { "id": "cl-b2", "title": "API 接入", "items": ["OpenAPI", "SDK 接入"] }
      ]
     },
     {
      "id": "cl-g2",
      "title": "网络接入",
      "blocks": [
       { "id": "cl-b3", "title": "专线接入", "items": ["MPLS 专线", "SD-WAN"] },
       { "id": "cl-b4", "title": "VPN 接入", "items": ["站点到站点", "远程接入"] }
      ]
     }
    ]
   },
   {
    "id": "cl-3",
    "name": "云管理平台",
    "bandColor": "#2379bd",
    "cols": 2,
    "stat": "4 大管理域",
    "groups": [
     {
      "id": "cl-g3",
      "title": "门户与运营",
      "blocks": [
       { "id": "cl-b5", "title": "服务门户", "items": ["资源申请", "工单管理", "自助操作"] },
       { "id": "cl-b6", "title": "运营管理", "items": ["租户管理", "资源配额", "计费账单"] }
      ]
     },
     {
      "id": "cl-g4",
      "title": "运维与计费",
      "blocks": [
       { "id": "cl-b7", "title": "运维管理", "items": ["资源编排", "变更管理", "故障处置"] },
       { "id": "cl-b8", "title": "计量计费", "items": ["资源计量", "费用核算", "账单生成"] }
      ]
     }
    ]
   },
   {
    "id": "cl-4",
    "name": "SaaS 应用层",
    "bandColor": "#1a5c94",
    "cols": 2,
    "stat": "5 类 SaaS 应用",
    "groups": [
     {
      "id": "cl-g5",
      "title": "办公协同",
      "blocks": [
       { "id": "cl-b9", "title": "协同办公", "items": ["文档协作", "即时通讯", "视频会议"] },
       { "id": "cl-b10", "title": "项目管理", "items": ["任务管理", "进度跟踪", "团队看板"] }
      ]
     },
     {
      "id": "cl-g6",
      "title": "业务应用",
      "blocks": [
       { "id": "cl-b11", "title": "CRM", "items": ["客户管理", "销售管线", "客户服务"] },
       { "id": "cl-b12", "title": "ERP", "items": ["财务核算", "供应链", "生产管理"] },
       { "id": "cl-b13", "title": "HRM", "items": ["组织人事", "考勤薪酬", "招聘管理"] }
      ]
     }
    ]
   },
   {
    "id": "cl-5",
    "name": "PaaS 平台层",
    "bandColor": "#143c66",
    "cols": 2,
    "stat": "4 大平台能力",
    "groups": [
     {
      "id": "cl-g7",
      "title": "应用运行",
      "blocks": [
       { "id": "cl-b14", "title": "容器服务", "items": ["容器集群", "镜像仓库", "编排调度"] },
       { "id": "cl-b15", "title": "微服务", "items": ["服务注册", "配置中心", "链路追踪"] }
      ]
     },
     {
      "id": "cl-g8",
      "title": "中间件与数据",
      "blocks": [
       { "id": "cl-b16", "title": "中间件", "items": ["消息队列", "分布式缓存", "任务调度"] },
       { "id": "cl-b17", "title": "数据库服务", "items": ["关系型数据库", "文档数据库", "时序数据库"] }
      ]
     }
    ]
   },
   {
    "id": "cl-6",
    "name": "IaaS 资源层",
    "bandColor": "#0e2a47",
    "cols": 2,
    "stat": "4 大资源类型",
    "groups": [
     {
      "id": "cl-g9",
      "title": "计算与存储",
      "blocks": [
       { "id": "cl-b18", "title": "计算资源", "items": ["云主机", "裸金属", "GPU 实例"] },
       { "id": "cl-b19", "title": "存储资源", "items": ["块存储", "对象存储", "文件存储"] }
      ]
     },
     {
      "id": "cl-g10",
      "title": "网络与安全",
      "blocks": [
       { "id": "cl-b20", "title": "网络资源", "items": ["VPC", "负载均衡", "弹性公网 IP"] },
       { "id": "cl-b21", "title": "安全服务", "items": ["防火墙", "入侵检测", "数据加密"] }
      ]
     }
    ]
   },
   {
    "id": "cl-7",
    "name": "基础设施层",
    "bandColor": "#081c33",
    "cols": 2,
    "stat": "物理基础设施",
    "groups": [
     {
      "id": "cl-g11",
      "title": "机房设施",
      "blocks": [
       { "id": "cl-b22", "title": "机房环境", "items": ["供电系统", "制冷系统", "消防系统"] },
       { "id": "cl-b23", "title": "网络架构", "items": ["骨干网络", "接入网络", "出口带宽"] }
      ]
     },
     {
      "id": "cl-g12",
      "title": "运维保障",
      "blocks": [
       { "id": "cl-b24", "title": "运维监控", "items": ["基础设施监控", "容量管理", "变更管理"] },
       { "id": "cl-b25", "title": "灾备体系", "items": ["同城双活", "异地灾备", "容灾演练"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 8. 微服务架构 ============ */
 "micro": {
  "id": "mi-1",
  "schemaVersion": 2,
  "title": "微服务架构",
  "subtitle": "接入层 → 服务层 → 公共组件层 → 数据层（含调用关系演示）",
  "layout": "layered",
  "connections": [
   { "id": "mi-c1", "from": "mi-2", "to": "mi-3", "label": "流量", "style": "solid" },
   { "id": "mi-c2", "from": "mi-3", "to": "mi-4", "label": "调用", "style": "dashed" }
  ],
  "showConnections": true,
  "legend": [
   { "id": "mi-l1", "color": "#2f80c2", "title": "接入层" },
   { "id": "mi-l2", "color": "#2379bd", "title": "服务层" },
   { "id": "mi-l3", "color": "#1a5c94", "title": "公共组件层" },
   { "id": "mi-l4", "color": "#143c66", "title": "数据层" }
  ],
  "layers": [
   {
    "id": "mi-2",
    "name": "接入层",
    "bandColor": "#2f80c2",
    "cols": 2,
    "stat": "4 个接入组件",
    "groups": [
     {
      "id": "mi-g1",
      "title": "流量入口",
      "blocks": [
       { "id": "mi-b1", "title": "API 网关", "items": ["路由转发", "协议转换", "鉴权认证", "灰度发布"] },
       { "id": "mi-b2", "title": "负载均衡", "items": ["四层转发", "七层转发", "健康检查", "会话保持"] }
      ]
     },
     {
      "id": "mi-g2",
      "title": "安全防护",
      "blocks": [
       { "id": "mi-b3", "title": "WAF 防护", "items": ["SQL 注入防护", "XSS 防护", "CC 防护"] },
       { "id": "mi-b4", "title": "流量管理", "items": ["限流熔断", "降级策略", "流量染色"] }
      ]
     }
    ]
   },
   {
    "id": "mi-3",
    "name": "服务层",
    "bandColor": "#2379bd",
    "cols": 3,
    "stat": "6 个业务服务",
    "groups": [
     {
      "id": "mi-g3",
      "title": "核心业务服务",
      "blocks": [
       { "id": "mi-b5", "title": "用户服务", "items": ["用户注册", "用户登录", "资料管理", "[依赖:用户中心]"] },
       { "id": "mi-b6", "title": "订单服务", "items": ["下单处理", "订单查询", "状态流转", "[依赖:订单中心]"] },
       { "id": "mi-b7", "title": "库存服务", "items": ["库存查询", "库存扣减", "库存回补", "[调用:商品中心]"] }
      ]
     },
     {
      "id": "mi-g4",
      "title": "支撑业务服务",
      "blocks": [
       { "id": "mi-b8", "title": "商品服务", "items": ["商品查询", "价格计算", "商品目录"] },
       { "id": "mi-b9", "title": "支付服务", "items": ["收单处理", "退款处理", "对账核查"] },
       { "id": "mi-b10", "title": "营销服务", "items": ["优惠计算", "券码核销", "活动规则"] }
      ]
     }
    ]
   },
   {
    "id": "mi-4",
    "name": "公共组件层",
    "bandColor": "#1a5c94",
    "cols": 3,
    "stat": "4 个公共组件",
    "groups": [
     {
      "id": "mi-g5",
      "title": "认证与消息",
      "blocks": [
       { "id": "mi-b11", "title": "统一认证", "items": ["JWT 签发", "OAuth2 授权", "令牌管理"] },
       { "id": "mi-b12", "title": "消息中心", "items": ["消息队列", "事件总线", "消息推送"] }
      ]
     },
     {
      "id": "mi-g6",
      "title": "配置与注册",
      "blocks": [
       { "id": "mi-b13", "title": "配置中心", "items": ["配置管理", "灰度配置", "配置回滚"] },
       { "id": "mi-b14", "title": "注册中心", "items": ["服务注册", "服务发现", "健康检查"] }
      ]
     },
     {
      "id": "mi-g7",
      "title": "监控与追踪",
      "blocks": [
       { "id": "mi-b15", "title": "链路追踪", "items": ["调用链采集", "耗时分析", "依赖拓扑"] },
       { "id": "mi-b16", "title": "监控告警", "items": ["指标采集", "告警规则", "通知分发"] }
      ]
     }
    ]
   },
   {
    "id": "mi-5",
    "name": "数据层",
    "bandColor": "#143c66",
    "cols": 2,
    "stat": "3 类数据服务",
    "groups": [
     {
      "id": "mi-g8",
      "title": "持久化",
      "blocks": [
       { "id": "mi-b17", "title": "数据库服务", "items": ["主库实例", "只读副本", "分库分表", "数据迁移"] },
       { "id": "mi-b18", "title": "缓存服务", "items": ["分布式缓存", "本地缓存", "缓存策略"] }
      ]
     },
     {
      "id": "mi-g9",
      "title": "数据管理",
      "blocks": [
       { "id": "mi-b19", "title": "数据治理", "items": ["数据备份", "数据归档", "数据脱敏"] },
       { "id": "mi-b20", "title": "搜索服务", "items": ["全文检索", "索引管理", "聚合查询"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 9. 安全架构(等保 2.0) ============ */
 "security": {
  "id": "sc-1",
  "schemaVersion": 2,
  "title": "安全架构（等保 2.0）",
  "subtitle": "安全物理环境 → 安全通信网络 → 安全区域边界 → 安全计算环境 → 安全管理中心",
  "layout": "layered",
  "connections": [],
  "showConnections": false,
  "legend": [
   { "id": "sc-l1", "color": "#4a7a4a", "title": "安全物理环境" },
   { "id": "sc-l2", "color": "#2f80c2", "title": "安全通信网络" },
   { "id": "sc-l3", "color": "#e6a817", "title": "安全区域边界" },
   { "id": "sc-l4", "color": "#1a5c94", "title": "安全计算环境" },
   { "id": "sc-l5", "color": "#c0392b", "title": "安全管理中心" }
  ],
  "layers": [
   {
    "id": "sc-2",
    "name": "安全物理环境",
    "bandColor": "#4a7a4a",
    "cols": 3,
    "stat": "3 个控制点",
    "groups": [
     {
      "id": "sc-g1",
      "title": "物理访问控制",
      "blocks": [
       { "id": "sc-b1", "title": "物理访问控制", "items": ["机房门禁", "来访登记", "视频监控", "电子巡查"] }
      ]
     },
     {
      "id": "sc-g2",
      "title": "环境保护",
      "blocks": [
       { "id": "sc-b2", "title": "环境保护", "items": ["温湿度控制", "防水防潮", "防雷接地", "防火措施"] }
      ]
     },
     {
      "id": "sc-g3",
      "title": "介质管理",
      "blocks": [
       { "id": "sc-b3", "title": "介质管理", "items": ["介质分类标识", "存储介质防护", "介质销毁处置"] }
      ]
     }
    ]
   },
   {
    "id": "sc-3",
    "name": "安全通信网络",
    "bandColor": "#2f80c2",
    "cols": 3,
    "stat": "3 个控制点",
    "groups": [
     {
      "id": "sc-g4",
      "title": "网络架构",
      "blocks": [
       { "id": "sc-b4", "title": "网络架构", "items": ["网络分区隔离", "链路冗余", "带宽保障", "网络拓扑管理"] }
      ]
     },
     {
      "id": "sc-g5",
      "title": "传输安全",
      "blocks": [
       { "id": "sc-b5", "title": "传输安全", "items": ["通信加密", "完整性校验", "密钥管理"] }
      ]
     },
     {
      "id": "sc-g6",
      "title": "设备安全",
      "blocks": [
       { "id": "sc-b6", "title": "网络设备安全", "items": ["设备加固", "配置管理", "固件更新"] }
      ]
     }
    ]
   },
   {
    "id": "sc-4",
    "name": "安全区域边界",
    "bandColor": "#e6a817",
    "cols": 3,
    "stat": "4 个控制点",
    "groups": [
     {
      "id": "sc-g7",
      "title": "边界防护",
      "blocks": [
       { "id": "sc-b7", "title": "访问控制", "items": ["访问控制策略", "最小权限原则", "策略定期审查"] },
       { "id": "sc-b8", "title": "边界防护", "items": ["防火墙策略", "入侵防御", "恶意代码防范"] }
      ]
     },
     {
      "id": "sc-g8",
      "title": "检测与审计",
      "blocks": [
       { "id": "sc-b9", "title": "入侵检测", "items": ["网络入侵检测", "异常流量分析", "威胁情报"] },
       { "id": "sc-b10", "title": "安全审计", "items": ["网络审计", "行为审计", "日志留存"] }
      ]
     }
    ]
   },
   {
    "id": "sc-5",
    "name": "安全计算环境",
    "bandColor": "#1a5c94",
    "cols": 3,
    "stat": "5 个控制点",
    "groups": [
     {
      "id": "sc-g9",
      "title": "身份与访问",
      "blocks": [
       { "id": "sc-b11", "title": "身份鉴别", "items": ["多因素认证", "口令策略", "身份唯一性", "鉴别信息保护"] },
       { "id": "sc-b12", "title": "访问控制", "items": ["权限最小化", "权限分离", "默认拒绝", "特权账户管理"] }
      ]
     },
     {
      "id": "sc-g10",
      "title": "审计与防护",
      "blocks": [
       { "id": "sc-b13", "title": "安全审计", "items": ["操作审计", "审计日志集中", "审计日志保护"] },
       { "id": "sc-b14", "title": "恶意代码防范", "items": ["病毒防护", "恶意代码检测", "补丁管理"] }
      ]
     },
     {
      "id": "sc-g11",
      "title": "数据与漏洞",
      "blocks": [
       { "id": "sc-b15", "title": "数据安全", "items": ["数据加密", "数据脱敏", "数据备份", "个人信息保护"] },
       { "id": "sc-b16", "title": "漏洞管理", "items": ["漏洞扫描", "渗透测试", "安全加固"] }
      ]
     }
    ]
   },
   {
    "id": "sc-6",
    "name": "安全管理中心",
    "bandColor": "#c0392b",
    "cols": 3,
    "stat": "3 个管理域",
    "groups": [
     {
      "id": "sc-g12",
      "title": "策略与运维",
      "blocks": [
       { "id": "sc-b17", "title": "安全策略管理", "items": ["安全策略制定", "策略评审更新", "策略发布执行"] },
       { "id": "sc-b18", "title": "安全运维", "items": ["安全事件响应", "应急处置流程", "安全态势感知"] }
      ]
     },
     {
      "id": "sc-g13",
      "title": "集中管控",
      "blocks": [
       { "id": "sc-b19", "title": "集中管控", "items": ["安全设备集中管理", "日志集中分析", "统一告警平台"] },
       { "id": "sc-b20", "title": "安全审计管理", "items": ["定期安全检查", "合规性评估", "审计报告生成"] }
      ]
     },
     {
      "id": "sc-g14",
      "title": "人员与制度",
      "blocks": [
       { "id": "sc-b21", "title": "人员安全管理", "items": ["安全意识培训", "岗位安全要求", "离岗离职管理"] },
       { "id": "sc-b22", "title": "安全管理制度", "items": ["管理制度体系", "操作规程规范", "制度执行监督"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 10. 数据流转·横向流向 ============ */
 "flow-data": {
  "schemaVersion": 2,
  "id": "fd-1",
  "title": "数据流转·横向流向",
  "subtitle": "数据源 → 数据集成 → ODS 贴源 → DWD 明细 → DWS 汇总 → ADS/数据服务（层间箭头=流向,仅相邻列）",
  "layout": "flow",
  "connections": [
   { "id": "fd-c1", "from": "fd-2", "to": "fd-3", "label": "抽取", "style": "solid" },
   { "id": "fd-c2", "from": "fd-3", "to": "fd-4", "label": "贴源", "style": "dashed" },
   { "id": "fd-c3", "from": "fd-4", "to": "fd-5", "label": "清洗", "style": "solid" },
   { "id": "fd-c4", "from": "fd-5", "to": "fd-6", "label": "汇总", "style": "dashed" },
   { "id": "fd-c5", "from": "fd-6", "to": "fd-7", "label": "服务", "style": "solid" }
  ],
  "showConnections": true,
  "legend": [
   { "id": "fd-l1", "color": "#2f80c2", "title": "数据源" },
   { "id": "fd-l2", "color": "#2379bd", "title": "数据集成" },
   { "id": "fd-l3", "color": "#1a5c94", "title": "ODS 贴源" },
   { "id": "fd-l4", "color": "#143c66", "title": "DWD 明细" },
   { "id": "fd-l5", "color": "#0e2a47", "title": "DWS 汇总" },
   { "id": "fd-l6", "color": "#081c33", "title": "ADS / 数据服务" }
  ],
  "layers": [
   {
    "id": "fd-2",
    "name": "数据源",
    "bandColor": "#2f80c2",
    "cols": 1,
    "stat": "3 类数据源",
    "groups": [
     {
      "id": "fd-g1",
      "title": "数据源",
      "blocks": [
       { "id": "fd-b1", "title": "业务库", "items": ["订单库", "用户库", "商品库"] },
       { "id": "fd-b2", "title": "日志库", "items": ["访问日志", "操作日志", "埋点日志"] },
       { "id": "fd-b3", "title": "外部数据", "items": ["第三方接口", "文件交换", "数据订阅"] }
      ]
     }
    ]
   },
   {
    "id": "fd-3",
    "name": "数据集成",
    "bandColor": "#2379bd",
    "cols": 1,
    "stat": "2 集成方式",
    "groups": [
     {
      "id": "fd-g2",
      "title": "集成方式",
      "blocks": [
       { "id": "fd-b4", "title": "CDC 实时采集", "items": ["Binlog 监听", "变更事件推送", "断点续传"] },
       { "id": "fd-b5", "title": "批量抽取", "items": ["全量同步", "增量同步", "调度编排"] }
      ]
     }
    ]
   },
   {
    "id": "fd-4",
    "name": "ODS 贴源层",
    "bandColor": "#1a5c94",
    "cols": 1,
    "stat": "与源系统结构一致",
    "groups": [
     {
      "id": "fd-g3",
      "title": "贴源存储",
      "blocks": [
       { "id": "fd-b6", "title": "贴源明细表", "items": ["业务原始快照", "增量变更日志"] },
       { "id": "fd-b7", "title": "数据质量校验", "items": ["空值检查", "一致性校验", "去重处理"] }
      ]
     }
    ]
   },
   {
    "id": "fd-5",
    "name": "DWD 明细层",
    "bandColor": "#143c66",
    "cols": 1,
    "stat": "主题域明细模型",
    "groups": [
     {
      "id": "fd-g4",
      "title": "明细建模",
      "blocks": [
       { "id": "fd-b8", "title": "交易明细", "items": ["订单事实表", "支付流水表", "退款明细"] },
       { "id": "fd-b9", "title": "行为明细", "items": ["浏览事实表", "搜索事实表", "点击事件表"] }
      ]
     }
    ]
   },
   {
    "id": "fd-6",
    "name": "DWS 汇总层",
    "bandColor": "#0e2a47",
    "cols": 1,
    "stat": "面向分析主题汇总",
    "groups": [
     {
      "id": "fd-g5",
      "title": "汇总模型",
      "blocks": [
       { "id": "fd-b10", "title": "经营汇总", "items": ["日销售汇总", "渠道汇总", "客户分层"] },
       { "id": "fd-b11", "title": "行为汇总", "items": ["活跃用户汇总", "转化漏斗汇总"] }
      ]
     }
    ]
   },
   {
    "id": "fd-7",
    "name": "ADS / 数据服务",
    "bandColor": "#081c33",
    "cols": 1,
    "stat": "统一对外数据出口",
    "groups": [
     {
      "id": "fd-g6",
      "title": "数据服务",
      "blocks": [
       { "id": "fd-b12", "title": "指标服务", "items": ["经营指标", "风险指标", "实时指标"] },
       { "id": "fd-b13", "title": "标签服务", "items": ["用户标签", "商品标签", "行为标签"] },
       { "id": "fd-b14", "title": "数据 API", "items": ["查询接口", "推送接口", "订阅接口"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 11. 服务调用链路·横向流向 ============ */
 "flow-api": {
  "schemaVersion": 2,
  "id": "fa-1",
  "title": "服务调用链路·横向流向",
  "subtitle": "客户端 → 接入层 → 服务层 → 数据层 → 监控审计（层间箭头=调用链,仅相邻列）",
  "layout": "flow",
  "connections": [
   { "id": "fa-c1", "from": "fa-2", "to": "fa-3", "label": "路由", "style": "solid" },
   { "id": "fa-c2", "from": "fa-3", "to": "fa-4", "label": "转发", "style": "dashed" },
   { "id": "fa-c3", "from": "fa-4", "to": "fa-5", "label": "调用", "style": "solid" },
   { "id": "fa-c4", "from": "fa-5", "to": "fa-6", "label": "读写", "style": "dashed" }
  ],
  "showConnections": true,
  "legend": [
   { "id": "fa-l1", "color": "#2f80c2", "title": "客户端" },
   { "id": "fa-l2", "color": "#2379bd", "title": "接入层" },
   { "id": "fa-l3", "color": "#1a5c94", "title": "服务层" },
   { "id": "fa-l4", "color": "#143c66", "title": "数据层" },
   { "id": "fa-l5", "color": "#0e2a47", "title": "监控 / 审计" }
  ],
  "layers": [
   {
    "id": "fa-2",
    "name": "客户端",
    "bandColor": "#2f80c2",
    "cols": 1,
    "stat": "3 类终端",
    "groups": [
     {
      "id": "fa-g1",
      "title": "终端接入",
      "blocks": [
       { "id": "fa-b1", "title": "Web 端", "items": ["PC 门户", "H5 移动端"] },
       { "id": "fa-b2", "title": "移动端", "items": ["原生 App", "小程序"] },
       { "id": "fa-b3", "title": "开放平台", "items": ["OpenAPI", "SDK 接入", "Webhook"] }
      ]
     }
    ]
   },
   {
    "id": "fa-3",
    "name": "接入层",
    "bandColor": "#2379bd",
    "cols": 1,
    "stat": "流量接入与安全",
    "groups": [
     {
      "id": "fa-g2",
      "title": "接入网关",
      "blocks": [
       { "id": "fa-b4", "title": "API 网关", "items": ["路由转发", "协议转换", "灰度发布"] },
       { "id": "fa-b5", "title": "负载均衡", "items": ["四层转发", "七层转发", "会话保持"] },
       { "id": "fa-b6", "title": "安全防护", "items": ["鉴权认证", "限流熔断", "WAF 防护"] }
      ]
     }
    ]
   },
   {
    "id": "fa-4",
    "name": "服务层",
    "bandColor": "#1a5c94",
    "cols": 1,
    "stat": "4 个核心服务",
    "groups": [
     {
      "id": "fa-g3",
      "title": "业务服务",
      "blocks": [
       { "id": "fa-b7", "title": "用户服务", "items": ["注册登录", "资料管理", "权限校验"] },
       { "id": "fa-b8", "title": "订单服务", "items": ["下单处理", "状态流转", "订单查询"] },
       { "id": "fa-b9", "title": "库存服务", "items": ["库存查询", "库存扣减", "库存回补"] },
       { "id": "fa-b10", "title": "支付服务", "items": ["收单处理", "退款处理", "对账核查"] }
      ]
     }
    ]
   },
   {
    "id": "fa-5",
    "name": "数据层",
    "bandColor": "#143c66",
    "cols": 1,
    "stat": "持久化与缓存",
    "groups": [
     {
      "id": "fa-g4",
      "title": "数据存储",
      "blocks": [
       { "id": "fa-b11", "title": "业务库", "items": ["主库实例", "只读副本", "分库分表"] },
       { "id": "fa-b12", "title": "缓存", "items": ["分布式缓存", "本地缓存", "缓存策略"] },
       { "id": "fa-b13", "title": "搜索", "items": ["全文检索", "索引管理"] }
      ]
     }
    ]
   },
   {
    "id": "fa-6",
    "name": "监控 / 审计",
    "bandColor": "#0e2a47",
    "cols": 1,
    "stat": "可观测性与合规",
    "groups": [
     {
      "id": "fa-g5",
      "title": "监控与审计",
      "blocks": [
       { "id": "fa-b14", "title": "链路监控", "items": ["调用链追踪", "耗时分析", "错误定位"] },
       { "id": "fa-b15", "title": "审计日志", "items": ["操作审计", "接口审计", "合规报告"] }
      ]
     }
    ]
   }
  ]
 },

 /* ============ 12. 事件流·横向流向 ============ */
 "flow-events": {
  "schemaVersion": 2,
  "id": "fe-1",
  "title": "事件流·横向流向",
  "subtitle": "事件源 → 消息平台 → 实时计算 → 落地存储（层间箭头=事件流向,仅相邻列）",
  "layout": "flow",
  "connections": [
   { "id": "fe-c1", "from": "fe-2", "to": "fe-3", "label": "发布", "style": "solid" },
   { "id": "fe-c2", "from": "fe-3", "to": "fe-4", "label": "订阅", "style": "dashed" },
   { "id": "fe-c3", "from": "fe-4", "to": "fe-5", "label": "写入", "style": "solid" }
  ],
  "showConnections": true,
  "legend": [
   { "id": "fe-l1", "color": "#2f80c2", "title": "事件源" },
   { "id": "fe-l2", "color": "#2379bd", "title": "消息平台" },
   { "id": "fe-l3", "color": "#1a5c94", "title": "实时计算" },
   { "id": "fe-l4", "color": "#143c66", "title": "落地存储" }
  ],
  "layers": [
   {
    "id": "fe-2",
    "name": "事件源",
    "bandColor": "#2f80c2",
    "cols": 1,
    "stat": "3 类事件生产者",
    "groups": [
     {
      "id": "fe-g1",
      "title": "事件生产",
      "blocks": [
       { "id": "fe-b1", "title": "交易事件", "items": ["下单事件", "支付事件", "退款事件"] },
       { "id": "fe-b2", "title": "行为事件", "items": ["浏览事件", "搜索事件", "点击事件"] },
       { "id": "fe-b3", "title": "系统日志", "items": ["应用日志", "服务日志", "告警日志"] }
      ]
     }
    ]
   },
   {
    "id": "fe-3",
    "name": "消息平台",
    "bandColor": "#2379bd",
    "cols": 1,
    "stat": "消息中间件",
    "groups": [
     {
      "id": "fe-g2",
      "title": "消息中间件",
      "blocks": [
       { "id": "fe-b4", "title": "Topic 管理", "items": ["业务 Topic", "日志 Topic", "系统 Topic"] },
       { "id": "fe-b5", "title": "分区策略", "items": ["按业务键分区", "轮询分区", "自定义路由"] },
       { "id": "fe-b6", "title": "消费组", "items": ["实时消费组", "离线消费组", "审计消费组"] }
      ]
     }
    ]
   },
   {
    "id": "fe-4",
    "name": "实时计算",
    "bandColor": "#1a5c94",
    "cols": 1,
    "stat": "流处理引擎",
    "groups": [
     {
      "id": "fe-g3",
      "title": "流处理",
      "blocks": [
       { "id": "fe-b7", "title": "流处理引擎", "items": ["事件过滤", "窗口聚合", "流关联"] },
       { "id": "fe-b8", "title": "实时指标", "items": ["实时 PV/UV", "实时交易额", "实时告警"] }
      ]
     }
    ]
   },
   {
    "id": "fe-5",
    "name": "落地存储",
    "bandColor": "#143c66",
    "cols": 1,
    "stat": "持久化存储",
    "groups": [
     {
      "id": "fe-g4",
      "title": "存储层",
      "blocks": [
       { "id": "fe-b9", "title": "明细存储", "items": ["事件明细表", "行为轨迹表"] },
       { "id": "fe-b10", "title": "汇总存储", "items": ["指标汇总表", "标签宽表"] },
       { "id": "fe-b11", "title": "数据湖", "items": ["原始事件归档", "冷数据沉淀"] }
      ]
     }
    ]
   }
  ]
 }
};
