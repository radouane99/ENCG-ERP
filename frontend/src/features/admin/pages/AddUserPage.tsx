import { useState } from 'react'

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="space-y-8 animate-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[#0f2863] italic erp-page-title">Add New User</h1>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-8 md:p-12">
        <form className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">Name</label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-border bg-card px-5 py-4 text-sm font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-ring transition-all outline-none rounded-[var(--control-radius)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">Email</label>
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-border bg-card px-5 py-4 text-sm font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-ring transition-all outline-none rounded-[var(--control-radius)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">Password</label>
              <input 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-border bg-card px-5 py-4 text-sm font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-ring transition-all outline-none rounded-[var(--control-radius)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">Confirm Password</label>
              <input 
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className="w-full border border-border bg-card px-5 py-4 text-sm font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-ring transition-all outline-none rounded-[var(--control-radius)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-border bg-card px-5 py-4 text-sm font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-ring transition-all outline-none rounded-[var(--control-radius)]"
              >
                <option value="">Select Role</option>
                <option value="ADMIN">Administrateur</option>
                <option value="PROFESSEUR">Professeur</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button 
              type="button" 
              className="px-8 py-3.5 bg-[#0f2863] text-white font-bold rounded-2xl hover:bg-[#1a387e] transition-colors text-sm uppercase tracking-wide shadow-md"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
