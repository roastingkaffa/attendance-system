# Attendance-system

ex :https://qrcode-generator.tw/
Generator QR-Code format:

25.136320394838833, 121.54297453763601



[Front-end]

1. Create vite project

npm create vite@latest my-project -- --template react

2. Install library

npm install sonner --legacy-peer-deps
npm install lucide-react --legacy-peer-deps
npm install react-qr-reader --legacy-peer-deps
npm install axios --legacy-peer-dep

3. Install tailwindcss
cd my-project
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

4. Modify tailwind.config.js and add below
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

5. Add rc/index.css file add below

@tailwind base;
@tailwind components;
@tailwind utilities;

6. Run command

npm run dev

[Back-end]

1. Install tools

pip install django
pip install pip3
pip install mysqlclient

2. Run command

python manage.py runserver