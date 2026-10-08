import * as echarts from 'echarts/core'

export const CHART_PALETTE = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // rose
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f97316'  // orange
]

export const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val || 0)
}

export const formatCompactNumber = (val) => {
  if (Math.abs(val) >= 1000000) {
    return (val / 1000000).toFixed(1).replace(/\.0$/, '') + ' Jt'
  }
  if (Math.abs(val) >= 1000) {
    return (val / 1000).toFixed(1).replace(/\.0$/, '') + ' Rb'
  }
  return String(val)
}

export const getModernTooltip = (customFormatter) => ({
  trigger: 'axis',
  backgroundColor: 'rgba(15, 23, 42, 0.92)',
  borderColor: 'rgba(255, 255, 255, 0.12)',
  borderWidth: 1,
  padding: [8, 12],
  textStyle: {
    color: '#f8fafc',
    fontSize: 12,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  extraCssText: 'box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); backdrop-filter: blur(8px); border-radius: 10px;',
  ...(customFormatter ? { formatter: customFormatter } : {})
})

export const getDonutTooltip = (unit = 'Rp') => ({
  trigger: 'item',
  backgroundColor: 'rgba(15, 23, 42, 0.92)',
  borderColor: 'rgba(255, 255, 255, 0.12)',
  borderWidth: 1,
  padding: [8, 12],
  textStyle: {
    color: '#f8fafc',
    fontSize: 12,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  extraCssText: 'box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); backdrop-filter: blur(8px); border-radius: 10px;',
  formatter: (params) => {
    const valFormatted = unit === 'Rp' ? formatIDR(params.value) : `${params.value} ${unit}`
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${params.color};"></span>
      <span style="font-weight:600;">${params.name}</span>
    </div>
    <div style="font-weight:bold;color:#38bdf8;">${valFormatted} <span style="font-size:11px;color:#94a3b8;font-weight:normal;">(${params.percent}%)</span></div>`
  }
})

export const createAreaGradient = (color, opacityTop = 0.45, opacityBottom = 0.02) => {
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color },
      { offset: 1, color: 'rgba(255, 255, 255, 0)' }
    ]
  }
}
