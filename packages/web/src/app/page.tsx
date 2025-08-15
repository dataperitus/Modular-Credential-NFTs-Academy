export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
          Modular Credential NFTs Academy
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Learn blockchain development and earn verifiable NFT credentials. 
          Complete modules to build your on-chain transcript and earn your degree.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/modules"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Start Learning
          </a>
          <a
            href="/governance"
            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Governance
          </a>
          <a href="/transcript" className="text-sm font-semibold leading-6 text-gray-900">
            View Transcript <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-bold">1</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Complete Modules</h3>
          <p className="mt-2 text-gray-600">
            Learn blockchain concepts and complete hands-on modules to earn NFT credentials.
          </p>
        </div>
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-bold">2</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Build Transcript</h3>
          <p className="mt-2 text-gray-600">
            Your module NFTs automatically build a verifiable on-chain academic transcript.
          </p>
        </div>
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-bold">3</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Earn Degree</h3>
          <p className="mt-2 text-gray-600">
            Complete all required modules to automatically receive your degree NFT.
          </p>
        </div>
      </div>
    </div>
  )
}
