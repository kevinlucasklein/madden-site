<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import { REGISTER_USER } from '@/graphql/mutations'
import type { RegisterInput, RegisterResponse } from '@/types/auth'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

const { mutate: register, loading, error: mutationError } = useMutation<
  { register: RegisterResponse },
  { input: RegisterInput }
>(REGISTER_USER)

watch(mutationError, (newError) => {
  if (newError) {
    error.value = newError.message
  }
})

const handleSubmit = async () => {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  try {
    const response = await register({
      input: {
        username: username.value,
        email: email.value,
        password: password.value  // Send plain password over HTTPS
      }
    })

    if (!response || !response.data) {
      throw new Error('No response from server')
    }

    const { token } = response.data.register
    if (token) {
      localStorage.setItem('token', token)
      router.push('/')
    } else {
      throw new Error('No token received')
    }

  } catch (e) {
    console.error('Registration error:', e)
    error.value = e instanceof Error ? e.message : 'An error occurred during registration'
  }
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="logo">
        <font-awesome-icon icon="football" class="logo-icon" />
      </div>
      <h2>Create Account</h2>
      <p class="subtitle">Join the Madden Draft Assistant community</p>

      <form @submit.prevent="handleSubmit" class="register-form">
        <div class="form-group">
          <label for="username">
            <font-awesome-icon icon="user" class="input-icon" />
            Username
          </label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            required
            placeholder="Enter your username"
          >
        </div>

        <div class="form-group">
          <label for="email">
            <font-awesome-icon icon="envelope" class="input-icon" />
            Email
          </label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required
            placeholder="Enter your email"
          >
        </div>

        <div class="form-group">
          <label for="password">
            <font-awesome-icon icon="lock" class="input-icon" />
            Password
          </label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required
            placeholder="Enter your password"
          >
        </div>

        <div class="form-group">
          <label for="confirmPassword">
            <font-awesome-icon icon="lock" class="input-icon" />
            Confirm Password
          </label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            required
            placeholder="Confirm your password"
          >
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button 
        type="submit" 
        class="submit-btn" 
        :disabled="loading"
      >
        {{ loading ? 'Creating Account...' : 'Create Account' }}
      </button>
    </form>

      <p class="login-link">
        Already have an account? 
        <RouterLink to="/login">Sign In</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  padding: 2rem;
}

.register-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 2.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  color: white;
}

h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(45deg, #00ff87 0%, #60efff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #a0a0a0;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #a0a0a0;
}

input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #00ff87;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(45deg, #00ff87 0%, #60efff 100%);
  color: #1a1a1a;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.submit-btn:hover {
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  color: #ff4646;
  margin-bottom: 1rem;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #a0a0a0;
}

.login-link a {
  color: #00ff87;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.logo {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo-icon {
  font-size: 3rem;
  background: linear-gradient(45deg, #00ff87 0%, #60efff 100%);
  background-clip: text;              /* Standard property */
  -webkit-background-clip: text;      /* Vendor prefix for Safari/Chrome */
  -webkit-text-fill-color: transparent;
}

.input-icon {
  margin-right: 0.5rem;
  color: #00ff87;
}

.error-message {
  color: #ff4646;
  background-color: rgba(255, 70, 70, 0.1);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}
</style>