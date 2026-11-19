import { useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";

export default function FormInput({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-4">
      <label className="block text-custom2 text-lg font-semibold mb-2" htmlFor={id}>
        {label}
      </label>
      <div className="relative flex items-center bg-bg-form border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-custom1">
        {Icon && (
          <span className="absolute left-3 text-black pointer-events-none">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <input
          type={isPassword && showPassword ? "text" : type}
          id={id}
          name={name || id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={label}
          className="w-full text-sm bg-transparent pl-10 pr-10 py-2.5 border-none rounded-lg text-form placeholder-form/70 focus:outline-none disabled:opacity-60"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-form hover:text-custom2 focus:outline-none"
            aria-label="Toggle Password Visibility"
          >
            {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}