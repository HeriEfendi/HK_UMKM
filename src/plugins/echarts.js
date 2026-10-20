import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  GraphicComponent
} from 'echarts/components'
import { LegacyGridContainLabel } from 'echarts/features'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  GridComponent,
  LegacyGridContainLabel,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  GraphicComponent
])

export { VChart }
