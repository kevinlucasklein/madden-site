<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="welcome-container">
    <div class="content">
      <div class="logo">
        <font-awesome-icon icon="football" class="logo-icon" />
      </div>
      <h1 class="title">Madden Draft Assistant</h1>
      <p class="subtitle">Your Ultimate NFL Draft Companion</p>
      
      <div class="cta-buttons">
        <RouterLink to="/register" class="btn btn-primary">
          <font-awesome-icon icon="user" class="btn-icon" />
          Get Started
        </RouterLink>
        <RouterLink to="/login" class="btn btn-secondary">
          <font-awesome-icon icon="lock" class="btn-icon" />
          Sign In
        </RouterLink>
      </div>

      <div class="features">
        <div class="feature-card">
          <font-awesome-icon icon="chart-line" class="feature-icon" />
          <h3>Player Analytics</h3>
          <p>Deep dive into player statistics and ratings</p>
        </div>
        <div class="feature-card">
          <font-awesome-icon icon="ranking-star" class="feature-icon" />
          <h3>Draft Strategy</h3>
          <p>Build your perfect team with smart recommendations</p>
        </div>
        <div class="feature-card">
          <font-awesome-icon icon="trophy" class="feature-icon" />
          <h3>Team Building</h3>
          <p>Optimize your roster for maximum performance</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  padding: 2rem;
}

.content {
  max-width: 1200px;
  text-align: center;
}

.logo {
  margin-bottom: 2rem;
}

.logo-icon {
  font-size: 3rem;
  background: linear-gradient(45deg, #00ff87 0%, #60efff 100%);
  background-clip: text;              /* Standard property */
  -webkit-background-clip: text;      /* Vendor prefix for Safari/Chrome */
  -webkit-text-fill-color: transparent;
}

.title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #00ff87 0%, #60efff 100%);
  background-clip: text;              /* Standard property */
  -webkit-background-clip: text;      /* Vendor prefix for Safari/Chrome */
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.5rem;
  color: #a0a0a0;
  margin-bottom: 3rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 4rem;
}

.btn {
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-primary {
  background: linear-gradient(45deg, #00ff87 0%, #60efff 100%);
  color: #1a1a1a;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 12px;
  transition: transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #00ff87 0%, #60efff 100%);
  background-clip: text;              /* Standard property */
  -webkit-background-clip: text;      /* Vendor prefix for Safari/Chrome */
  -webkit-text-fill-color: transparent;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #a0a0a0;
}

@media (max-width: 768px) {
  .title {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1.2rem;
  }

  .cta-buttons {
    flex-direction: column;
  }

  .logo-icon {
    font-size: 3rem;
  }
}
</style>