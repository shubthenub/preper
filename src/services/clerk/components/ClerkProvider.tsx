import { ClerkProvider as OriginalClerkProvider } from '@clerk/nextjs';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <> 
    {/* pass theming props to original provider later  */}
    <OriginalClerkProvider>  
        {children}
    </OriginalClerkProvider>
    </>
  )
  
}