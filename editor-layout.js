/* ===== 布局范式注册表 =====
   加一种布局 = ① 在 LAYOUT_LIST 里加一条(render 返回 HTML 并给盒子打 data-role)
                ② 给新盒子写 CSS
                ③ (可选)在 diagram.ext.<id> 里放布局专属数据
   三条契约(写在 contributing / usage.md 里,比代码更重要):
     1) 布局只负责「盒子怎么摆」,不许自己画 <svg>/<canvas> —— 导出是按 DOM 实测几何采集的,
        画在画布上就量不到,PNG/SVG/drawio 会直接失真;
     2) 每个可见盒子必须带 data-role(title/subtitle/layer/band/group/card/item/sidebar/legend…),
        导出与校验都靠它认结构,不靠 class 名;
     3) 布局不许改 core 数据模型 —— 要新数据就放 diagram.ext.<id>,由 migrateDiagram 保留未知字段。
   现有两个布局共用同一套连线机制(层→层),差异都在 caps 里声明,不再散落 if 判断。 */
const LAYOUT_LIST = [
  {
    id: 'layered',
    name: '多层横向',        /* 属性面板下拉里的叫法 */
    short: '纵向分层',       /* 模板库/开始页标签里的叫法 */
    family: 'list',          /* list / matrix / radial:同族之间切换不需要转换数据 */
    caps: {
      conn: 'rails',         /* 连线形态:rails=左侧多轨道 | gaps=列间箭头 | none=不支持连线 */
      connAdjacent: false,   /* 是否只允许相邻两列连线(flow 是,layered 不是) */
      railPad: true,         /* 是否为左侧轨道留白(渲染时包 .lay-stack) */
      sidebar: true,         /* 是否支持右侧体系通栏 */
    },
    drawio: { swimlane: { horizontal: false, startSize: 52, fontSize: 17 }, exit: 'left' },
    render(d) { return renderLayered(d); },
  },
  {
    id: 'flow',
    name: '横向流向',
    short: '横向流向',
    family: 'list',
    caps: { conn: 'gaps', connAdjacent: true, railPad: false, sidebar: true },
    drawio: { swimlane: { horizontal: true, startSize: 36, fontSize: 15 }, exit: 'right' },
    render(d) { return renderFlow(d); },
  },
  {
    id: 'table',
    name: '清单表格',
    short: '清单',
    family: 'list',            /* 和 layered 同族:同一份数据换个摆法,不需要转换 */
    caps: {
      conn: 'none',            /* 表格里不画连线:A→B 的关系在表格里没有位置,硬画会穿过格子 */
      connAdjacent: false,
      railPad: false,
      sidebar: false,          /* 右侧通栏在表格里会挤掉列宽,清单图不需要 */
    },
    drawio: { swimlane: { horizontal: false, startSize: 44, fontSize: 15 }, exit: 'right' },
    render(d) { return renderTable(d); },
  },
];

const LAYOUTS = {};
LAYOUT_LIST.forEach(function (L) { LAYOUTS[L.id] = L; });
const DEFAULT_LAYOUT = 'layered';

/* 取布局描述:未知/缺失一律退到默认布局,不让一张坏数据把画布渲染成空白 */
function layoutOf(d) {
  var id = d && d.layout;
  return LAYOUTS[id] || LAYOUTS[DEFAULT_LAYOUT];
}
function layoutCaps(d) { return layoutOf(d).caps; }
function isKnownLayout(id) { return !!LAYOUTS[id]; }
function layoutName(id) { return (LAYOUTS[id] || LAYOUTS[DEFAULT_LAYOUT]).name; }
function layoutShort(id) { return (LAYOUTS[id] || LAYOUTS[DEFAULT_LAYOUT]).short; }
