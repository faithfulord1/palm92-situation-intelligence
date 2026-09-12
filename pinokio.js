module.exports = {
  version: "7.0",
  title: "Palm92 Situation Intelligence",
  description: "Governed situational awareness and incident intelligence.",
  menu: async (kernel, info) => {
    const running = {
      install: info.running("install.js"),
      start: info.running("start.js"),
      update: info.running("update.js"),
      reset: info.running("reset.js")
    }
    const installed = info.exists("app/server.mjs")

    if (running.install) return [{ default: true, icon: "fa-solid fa-plug", text: "Installing", href: "install.js" }]
    if (installed && running.start) {
      const local = info.local("start.js")
      if (local && local.url) return [
        { default: true, icon: "fa-solid fa-globe", text: "Open Dashboard", href: local.url },
        { icon: "fa-solid fa-terminal", text: "Terminal", href: "start.js" },
        { icon: "fa-solid fa-book", text: "README", href: "README.md?raw=true" }
      ]
      return [{ default: true, icon: "fa-solid fa-terminal", text: "Terminal", href: "start.js" }]
    }
    if (installed) return [
      { default: true, icon: "fa-solid fa-power-off", text: "Start", href: "start.js" },
      { icon: "fa-solid fa-rotate", text: "Update", href: "update.js" },
      { icon: "fa-solid fa-broom", text: "Reset", href: "reset.js" },
      { icon: "fa-solid fa-book", text: "README", href: "README.md?raw=true" }
    ]
    return [
      { default: true, icon: "fa-solid fa-plug", text: "Install", href: "install.js" },
      { icon: "fa-solid fa-book", text: "README", href: "README.md?raw=true" }
    ]
  }
}
