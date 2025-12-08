import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import  arcjet, { detectBot, shield, slidingWindow }  from '@arcjet/next'
import { env } from './data/env/server'  //custom typeSafe envs

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/'])

export default clerkMiddleware(async (auth, req) => {
  const decision = await aj.protect(req)
  if (decision.isDenied()) {
    return new Response('Too many requests, try again later!', { status: 429 })
  }
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

const aj = arcjet({
  key: env.ARCJET_KEY,  //added typesafety for envs (t3-oss library maybe )
  rules:[
    shield({mode:'LIVE'}),  // protect all routes with injection shield
    detectBot({// detect bots
      mode:'LIVE',
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],  
    }),
    slidingWindow({
      mode:'LIVE',
      interval:"1m", 
      max:100, // max 100 requests per interval
    })   

  ]
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}