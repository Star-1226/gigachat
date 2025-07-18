import { Counter } from "./components/Counter"

export function App() {
  return (
    <div className="min-h-screen flex flex-col gap-20 justify-between px-10 py-20">
      <h1 className="text-3xl md:text-4xl md:leading-normal font-bold text-center">
        Welcome to your Kaioken CSR app!
      </h1>
      <Counter />
      <div className="text-center text-stone-200">
        <p>Learn at</p>
        <div className="flex gap-4 text-xl w-full justify-center">
          <a
            href="https://kaioken.dev"
            target="_blank"
            className="font-semibold flex items-center gap-1 w-full justify-center"
          >
            <img className="w-5 h-5" src="/favicon.svg" alt="kaioken logo" />
            kaioken.dev
          </a>
        </div>
      </div>
    </div>
  )
}
