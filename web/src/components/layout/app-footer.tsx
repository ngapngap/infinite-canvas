"use client";

import { Globe } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="border-t border-stone-200 bg-background px-6 py-10 dark:border-stone-800">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="size-5 shrink-0 bg-stone-950 dark:bg-stone-100"
                style={{
                  mask: "url(/logo.svg) center / contain no-repeat",
                  WebkitMask: "url(/logo.svg) center / contain no-repeat",
                }}
              />
              <span className="text-base font-semibold text-stone-950 dark:text-stone-100">Ram Canvas</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">
              Công cụ sáng tạo trên canvas vô hạn. Tạo, kết nối và tái tổ hợp hình ảnh, văn bản trên một không gian không giới hạn.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-950 dark:text-stone-100">Hệ sinh thái Ram</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <a href="https://ramclouds.me" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-100">
                  <Globe className="size-3.5" />
                  <span>ramclouds.me</span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">— AI API Gateway</span>
                </a>
              </li>
              <li>
                <a href="https://ramrouter.me" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-100">
                  <Globe className="size-3.5" />
                  <span>ramrouter.me</span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">— Smart Router</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-950 dark:text-stone-100">Về chúng tôi</h3>
            <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">
              Ram cung cấp hạ tầng AI cho nhà phát triển và người sáng tạo. Kết nối nhiều mô hình AI qua một API duy nhất.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-stone-200 pt-6 text-center text-xs text-stone-400 dark:border-stone-800 dark:text-stone-500">
          © {new Date().getFullYear()} Ram Ecosystem. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
