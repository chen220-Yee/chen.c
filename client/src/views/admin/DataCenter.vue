<template>
  <div class="data-center">
    <h3>数据中心</h3>
    
    <!-- 数据概览卡片 -->
    <div class="stat-cards">
      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>用户统计</span>
          </div>
        </template>
        <div class="stat-value">{{ stats.userStats?.total || 0 }}</div>
        <div class="stat-label">总用户数</div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>笔记统计</span>
          </div>
        </template>
        <div class="stat-value">{{ stats.postStats?.total || 0 }}</div>
        <div class="stat-label">总笔记数</div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>评论统计</span>
          </div>
        </template>
        <div class="stat-value">{{ stats.postStats?.comments || 0 }}</div>
        <div class="stat-label">总评论数</div>
      </el-card>
    </div>

    <!-- 分类统计图表 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>笔记分类统计</span>
        </div>
      </template>
      <div id="categoryChart" style="height: 400px"></div>
    </el-card>

    <!-- 发布趋势图表 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>笔记发布趋势</span>
        </div>
      </template>
      <div id="trendChart" style="height: 400px"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statsApi } from '../../api/stats'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const stats = ref({})
let categoryChart = null
let trendChart = null

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await statsApi.getDashboardStats()
    if (res.data.success) {
      stats.value = res.data.data
      renderCharts()
    }
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

// 渲染图表
const renderCharts = () => {
  // 渲染分类统计图表
  if (stats.value.categoryStats) {
    const categoryData = stats.value.categoryStats.map(item => ({
      name: getCategoryName(item._id),
      value: item.count
    }))

    categoryChart = echarts.init(document.getElementById('categoryChart'))
    categoryChart.setOption({
      title: {
        text: '笔记分类分布'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [
        {
          name: '分类统计',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside'
          },
          labelLine: {
            show: true
          },
          data: categoryData
        }
      ]
    })
  }

  // 渲染发布趋势图表
  if (stats.value.monthlyStats) {
    const monthlyData = stats.value.monthlyStats.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      count: item.count
    })).reverse()

    trendChart = echarts.init(document.getElementById('trendChart'))
    trendChart.setOption({
      title: {
        text: '笔记发布趋势'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: monthlyData.map(item => item.month)
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '发布数量',
          type: 'line',
          smooth: true,
          data: monthlyData.map(item => item.count),
          areaStyle: {}
        }
      ]
    })
  }
}

// 获取分类名称
const getCategoryName = (category) => {
  const categoryMap = {
    books: '书籍',
    food: '美食',
    home: '家居',
    fashion: '穿搭',
    travel: '旅行',
    other: '其他'
  }
  return categoryMap[category] || category
}

// 监听窗口大小变化，重绘图表
window.addEventListener('resize', () => {
  categoryChart?.resize()
  trendChart?.resize()
})

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.data-center {
  padding: 20px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  margin: 10px 0;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 