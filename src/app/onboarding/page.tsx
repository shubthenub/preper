import { getCurrentUser } from '@/services/clerk/lib/getCurrentUser';
import { redirect } from 'next/navigation';
import React from 'react'
import { OnboardingClient } from './_client';

const OnboardingPage = async () => {
    const {userId , user } = await getCurrentUser({allData:true});
    if(userId == null) return redirect('/');
    // if(user!=null) return redirect("/app");

    return <div className='container flex flex-col items-center justify-center h-screen gap-4'>
        <h1>Getting you onboard!</h1>
        <h2>
            <OnboardingClient userId = {userId} />
        </h2>
    </div>
}

export default OnboardingPage
