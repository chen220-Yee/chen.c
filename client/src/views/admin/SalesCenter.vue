<template>
  <div class="sales-center">
    <h2>销售数据中心</h2>
    
    <!-- 总体数据卡片 -->
    <el-row :gutter="20" class="data-cards">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>总销售额</span>
            </div>
          </template>
          <div class="card-value">¥{{ formatNumber(totalStats.totalSales) }}</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>总订单数</span>
            </div>
          </template>
          <div class="card-value">{{ formatNumber(totalStats.totalOrders) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 商品分类销售统计图表 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>分类销量统计</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="quantityChartRef" style="height: 400px"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>热销商品统计</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="salesChartRef" style="height: 400px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 销售趋势图表 -->
    <el-card class="trend-chart">
      <template #header>
        <div class="card-header">
          <span>销售趋势</span>
        </div>
      </template>
      <div class="chart-container">
        <div ref="trendChartRef" style="height: 400px"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { statsApi } from '../../api/stats'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const quantityChartRef = ref(null)
const salesChartRef = ref(null)
const trendChartRef = ref(null)
const totalStats = ref({ totalSales: 0, totalOrders: 0 })

// 存储图表实例
let charts = {
  quantity: null,
  sales: null,
  trend: null
}

// 格式化数字
const formatNumber = (num) => {
  return num?.toLocaleString() || 0
}

// 初始化分类销量图表（柱状图）
const initQuantityChart = (data) => {
  if (!data || data.length === 0) {
    console.warn('销量数据为空');
    return;
  }

  charts.quantity = echarts.init(quantityChartRef.value)
  
  try {
    charts.quantity.setOption({
      title: {
        text: '分类销量排行'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: data.map(item => item.category)
      },
      series: [
        {
          name: '销量',
          type: 'bar',
          data: data.map(item => item.quantity)
        }
      ]
    })
  } catch (error) {
    console.error('初始化销量图表失败:', error);
  }
}

// 初始化商品销售额图表（饼图）
const initSalesChart = (data) => {
  if (!data || data.length === 0) {
    console.warn('销售额数据为空');
    return;
  }

  charts.sales = echarts.init(salesChartRef.value)
  
  try {
    charts.sales.setOption({
      title: {
        text: '热销商品TOP10'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      series: [
        {
          type: 'pie',
          radius: '70%',
          data: data.map(item => ({
            name: item.name,
            value: item.sales
          }))
        }
      ]
    })
  } catch (error) {
    console.error('初始化销售额图表失败:', error);
  }
}

// 初始化销售趋势图表
const initTrendChart = (data) => {
  const chart = echarts.init(trendChartRef.value)
  chart.setOption({
    title: {
      text: '销售趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item._id)
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      {
        type: 'value',
        name: '订单数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        data: data.map(item => item.sales),
        smooth: true
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        data: data.map(item => item.orders)
      }
    ]
  })
}

// 获取销售统计数据
const fetchSalesStats = async () => {
  try {
    const res = await statsApi.getSalesStats()
    console.log('获取到的统计数据:', res.data);
    
    if (res.data.success) {
      const { total, categories, products, trend } = res.data.data
      totalStats.value = total
      
      if (!categories || categories.length === 0) {
        console.warn('没有分类统计数据');
        return;
      }

      // 初始化各个图表
      initQuantityChart(categories)
      initSalesChart(products)
      initTrendChart(trend)
    }
  } catch (error) {
    console.error('获取销售统计数据失败:', error);
    ElMessage.error('获取销售统计数据失败')
  }
}

onMounted(() => {
  fetchSalesStats()
})

// 监听窗口大小变化，重新渲染图表
window.addEventListener('resize', () => {
  const quantityChart = echarts.getInstanceByDom(quantityChartRef.value);
  const salesChart = echarts.getInstanceByDom(salesChartRef.value);
  const trendChart = echarts.getInstanceByDom(trendChartRef.value);
  
  quantityChart?.resize();
  salesChart?.resize();
  trendChart?.resize();
});

// 组件卸载时清理图表实例
onUnmounted(() => {
  Object.values(charts).forEach(chart => {
    if (chart) {
      chart.dispose();
    }
  });
});
</script>

<style scoped>
.sales-center {
  padding: 20px;
}

.data-cards {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  text-align: center;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-container {
  padding: 10px;
}

.trend-chart {
  margin-bottom: 20px;
}
</style> 