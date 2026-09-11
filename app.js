const MAX_HISTORY = 20
const STORAGE = 'jadeYouthWebBraceletV2'
const SIZE_STORAGE = 'jadeYouthBraceletSize'
const featureIds = ['A1', 'A2', 'C5', 'C9']
const colorFamilies8 = [
  ['B1', 'B2', 'B4', 'B5', 'B6', 'B9', 'B16', 'C1', 'C2', 'C3', 'C4'],
  ['A3', 'A5', 'A7', 'B8', 'B10', 'B13', 'B17'],
  ['A4', 'A6', 'A10', 'B7', 'B12', 'B14', 'C6'],
  ['A8', 'A9', 'B3', 'B11', 'B18', 'B19', 'C7', 'C8', 'C10']
]
const colorFamilies10 = [['A1', 'A2', 'C5', 'C9']]
const allIds = [...Array(10)].map((_, i) => `A${i + 1}`)
  .concat([...Array(20)].map((_, i) => `B${i + 1}`), [...Array(10)].map((_, i) => `C${i + 1}`))
const materials = allIds.filter(id => id !== 'B15').map(id => ({
  id,
  type: featureIds.includes(id) ? 'bead10' : 'bead8',
  size: featureIds.includes(id) ? 10 : 8,
  image: `assets/beads/${id}-v2.png`
})).concat([
  { id: 'spacer-gold', type: 'spacer', size: 6, image: 'assets/beads/B15-v3.png' },
  { id: 'charm-flower', type: 'accessory', size: 11, image: 'assets/accessories/flower-v2.png' },
  { id: 'charm-heart', type: 'accessory', size: 11, image: 'assets/accessories/heart-v2.png' }
])

let design = safeParse(localStorage.getItem(STORAGE), [])
let braceletSize = Number(localStorage.getItem(SIZE_STORAGE)) || 0
let sizeName = ({ 18: '小', 20: '中', 22: '大' })[braceletSize] || ''
let history = []
let selected = null
let toastTimer
const $ = selector => document.querySelector(selector)

function safeParse(value, fallback) { try { return JSON.parse(value) || fallback } catch (_) { return fallback } }
function save() { localStorage.setItem(STORAGE, JSON.stringify(design)); if (braceletSize) localStorage.setItem(SIZE_STORAGE, braceletSize) }
function remember() { history.push(design.map(item => ({ ...item }))); if (history.length > MAX_HISTORY) history.shift() }
function showToast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1800) }
function materialById(id) { return materials.find(item => item.id === id) }
function itemLabel(item) { return item.type === 'bead8' ? '8mm 珠子' : item.type === 'bead10' ? '10mm 珠子' : item.type === 'spacer' ? '隔片' : '配饰' }
function imageMarkup(item, className = '') { return `<img class="${className}" src="${item.image}" alt="${itemLabel(item)}">` }

function drawDisc(target, interactive) {
  target.querySelectorAll('.bead').forEach(node => node.remove())
  const rect = target.getBoundingClientRect(), center = rect.width / 2, radius = rect.width * .345
  const slotCount = braceletSize || design.length || 1
  design.forEach((item, index) => {
    // 固定使用所选手链的槽位：从正上方开始，新增材料依次顺时针排入下一格。
    const angle = 2 * Math.PI * index / slotCount - Math.PI / 2
    const ratio = item.type === 'accessory' ? .115 : item.type === 'bead10' ? .105 : item.type === 'spacer' ? .07 : .087
    const node = document.createElement(interactive ? 'button' : 'i')
    node.className = `bead ${item.type === 'accessory' ? 'accessory' : ''}${interactive && selected === item.uid ? ' selected' : ''}`
    node.style.cssText = `left:${center + radius * Math.cos(angle)}px;top:${center + radius * Math.sin(angle)}px;width:${rect.width * ratio}px;height:${rect.width * ratio}px`
    node.innerHTML = imageMarkup(item)
    if (interactive) node.onclick = () => { selected = item.uid; draw() }
    target.append(node)
  })
}

function draw() {
  drawDisc($('#disc'), true)
  $('#empty').hidden = !!design.length
  $('#centre').hidden = !design.length
  $('#delete').hidden = !selected
  $('#chosen').textContent = design.length
  $('#sizeName').textContent = braceletSize ? `${sizeName}号` : '未选择'
  $('#count').textContent = braceletSize ? `${design.length} / ${braceletSize}` : `${design.length} / --`
  $('#remaining').textContent = braceletSize ? (design.length >= braceletSize ? '数量已满' : `还可添加 ${braceletSize - design.length} 个`) : '请先选择尺寸'
  save()
}

function add(item) {
  if (!braceletSize) { openSizeModal(); return }
  if (design.length >= braceletSize) { showToast(`${sizeName}号手链已经放满啦`); return }
  remember()
  design.push({ ...item, uid: `${Date.now()}-${Math.random()}` })
  selected = null
  draw()
}

function renderTiles(list, target) {
  $(target).innerHTML = list.map(item => `<button class="tile ${item.type === 'bead10' ? 'large' : ''} ${item.type === 'accessory' ? 'accessory' : ''}" data-id="${item.id}" aria-label="添加${itemLabel(item)}">${imageMarkup(item)}</button>`).join('')
  $(target).onclick = event => { const id = event.target.closest('.tile')?.dataset.id; if (id) add(materialById(id)) }
}

function openSizeModal() { $('#cancelSize').hidden = !braceletSize; $('#sizeModal').classList.remove('closed') }
function chooseSize(newSize, newName) {
  if (design.length > newSize && !confirm(`当前已有 ${design.length} 个材料，改为${newName}号会保留前 ${newSize} 个。确定更换吗？`)) return
  if (design.length > newSize) { remember(); design = design.slice(0, newSize) }
  braceletSize = newSize
  sizeName = newName
  selected = null
  $('#sizeModal').classList.add('closed')
  draw()
}

renderTiles(materials.filter(item => item.type === 'bead8'), '#beads8')
renderTiles(materials.filter(item => item.type === 'bead10'), '#beads10')
renderTiles(materials.filter(item => item.type === 'spacer'), '#spacers')
renderTiles(materials.filter(item => item.type === 'accessory'), '#accessories')
document.querySelectorAll('.size-options button').forEach(button => button.onclick = () => chooseSize(Number(button.dataset.size), button.dataset.name))
$('#changeSize').onclick = openSizeModal
$('#cancelSize').onclick = () => $('#sizeModal').classList.add('closed')
$('#delete').onclick = () => { remember(); design = design.filter(item => item.uid !== selected); selected = null; draw() }
$('#undo').onclick = () => { if (!history.length) return showToast('暂时没有可撤销的操作'); design = history.pop(); selected = null; draw() }
$('#clear').onclick = () => { if (design.length && confirm('确定要清空当前设计吗？')) { remember(); design = []; selected = null; draw() } }
$('#random').onclick = () => {
  if (!braceletSize) return openSizeModal()
  remember()
  // 每次只选择一个尺寸和一个色系，不混用 8mm / 10mm。
  const use10mm = Math.random() < .25
  const families = use10mm ? colorFamilies10 : colorFamilies8
  const family = families[Math.floor(Math.random() * families.length)]
  const pool = family.map(materialById).filter(Boolean)
  design = Array.from({ length: braceletSize }, (_, index) => {
    const picked = pool[Math.floor(Math.random() * pool.length)]
    return { ...picked, uid: `${Date.now()}-${index}-${Math.random()}` }
  })
  selected = null
  draw()
  showToast(`已生成${use10mm ? '10mm' : '8mm'}同色系搭配`)
}

function showResult() {
  if (!braceletSize) return openSizeModal()
  if (design.length < braceletSize) return showToast(`还差 ${braceletSize - design.length} 个材料`)
  $('#designer').style.display = 'none'
  $('#result').classList.add('show')
  drawDisc($('#previewDisc'), false)
  const counts = {}
  design.forEach(item => counts[item.id] = (counts[item.id] || 0) + 1)
  $('#stats').innerHTML = Object.entries(counts).map(([id, count]) => {
    const item = materialById(id)
    return `<div class="stat">${imageMarkup(item, item.type === 'accessory' ? 'accessory' : '')}<span>${itemLabel(item)}</span><b>× ${count}</b></div>`
  }).join('')
  $('#resultCount').textContent = design.length
  $('#resultSize').textContent = `${sizeName}号手链 · ${braceletSize} 个材料`
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

$('#finish').onclick = showResult
$('#edit').onclick = () => { $('#designer').style.display = 'block'; $('#result').classList.remove('show'); draw(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
$('#restart').onclick = () => {
  if (confirm('当前手串会被清空，并重新选择尺寸。')) {
    design = []; selected = null; braceletSize = 0; sizeName = ''
    localStorage.removeItem(STORAGE); localStorage.removeItem(SIZE_STORAGE)
    $('#edit').click(); openSizeModal()
  }
}
window.addEventListener('resize', () => { if ($('#result').classList.contains('show')) drawDisc($('#previewDisc'), false); else draw() })
if (braceletSize && ![18, 20, 22].includes(braceletSize)) { braceletSize = 0; sizeName = '' }
if (!braceletSize) openSizeModal(); else $('#sizeModal').classList.add('closed')
draw()
