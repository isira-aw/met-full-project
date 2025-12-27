import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { LoadingSpinner } from "../components/UI/LoadingSpinner";

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        setTimeout(() => setError(""), 300); // Wait for fade out animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent form refresh and clear any existing errors
    setError("");
    setShowError(false);
    setLoading(true);

    try {
      // Validate form data
      if (!formData.email.trim() || !formData.password.trim()) {
        setError("Please fill in all fields");
        return;
      }

      if (!isValidEmail(formData.email)) {
        setError("Please enter a valid email address");
        return;
      }

      const response = await apiService.login(formData);

      if (response.status && response.data) {
        // Clear form on successful login
        setFormData({ email: "", password: "" });

        // Login with new AuthTokenResponse
        login(response.data);

        // Navigate based on role
        const isAdmin = response.data.role === 'ADMIN';
        navigate(isAdmin ? "/dashboard" : "/my-tasks");
      } else {
        setError(
          response.message || "Invalid email or password. Please try again."
        );
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle different types of errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError(
          "Unable to connect to server. Please check your internet connection and try again."
        );
      } else if (error.response?.status === 401) {
        setError("Invalid email or password. Please check your credentials.");
      } else if (error.response?.status === 429) {
        setError(
          "Too many login attempts. Please wait a moment and try again."
        );
      } else if (error.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error && showError) {
      setShowError(false);
      setTimeout(() => setError(""), 300);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCloseError = () => {
    setShowError(false);
    setTimeout(() => setError(""), 300);
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-40 h-0 pb-[20%] relative flex items-center justify-center mx-auto mb-4">
              <img
                src="https://github.com/isira-aw/Metropolitan-B/blob/deploy/metro37.jpg?raw=true"
                alt="cropped-image"
                className="object-cover w-full h-full absolute top-0 left-0"
              />
            </div>

            <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
          </div>

          {/* Enhanced Error Display */}
          {error && (
            <div
              className={`mb-6 transition-all duration-300 ease-in-out ${
                showError
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform -translate-y-2"
              }`}
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 relative">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-700 text-sm leading-relaxed">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseError}
                    className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                    aria-label="Close error message"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  error && !formData.email.trim()
                    ? "border-red-300 bg-red-50"
                    : "border-slate-300"
                }`}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    error && !formData.password.trim()
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              disabled={
                loading || !formData.email.trim() || !formData.password.trim()
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* <div className="mt-6 text-center">
            <p className="text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                tabIndex={loading ? -1 : 0}
              >
                Add Employee
              </Link>
            </p>
          </div> */}

          {/* Additional Help */}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              onClick={() => {
                setError("");
                setShowError(false);
                setFormData({ email: "", password: "" });
              }}
            >
              Clear form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};