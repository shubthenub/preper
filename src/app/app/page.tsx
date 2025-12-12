import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/drizzle/db";
import { JobInfoTable } from "@/drizzle/schema";
import { JobInfoForm } from "@/features/jobInfos/components/JobInfoForm";
import { getJobInfoUserTag } from "@/features/jobInfos/components/dbCache";
import { getJobInfoTag } from "@/lib/dataCache";
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";
import { eq } from "drizzle-orm";
import { Loader2Icon } from "lucide-react";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function AppPage(){
    return(
        <Suspense fallback={<div className="h screen-header flex items-center justify-center">
            <Loader2Icon className="size-24 animate-spin"/>
        </div>}>
            <JobInfos/>

        </Suspense>
    )
}


async function JobInfos(){
    const {userId, redirectToSignIn} = await getCurrentUser({allData:false});
    if (!userId) {
        return redirect('/sign-in');
    }

    const jobInfos = await getJobInfos(userId as string);

    if(jobInfos?.length===0){
        return <NoJobInfos/>

    }
}

function NoJobInfos(){
    return <div className="container my-4 py-4 max-w-5xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">Welcome to preper!</h1>
        <p className="mt-2 text-muted-foreground">
            It looks like you don't have any job infos yet. Get started by creating your first job info below.
        </p>
        <div className="mt-2">
            <Card>
                <CardContent>
                    <JobInfoForm/>
                </CardContent>
            </Card>
        </div>
        
    </div>
}

async function getJobInfos(userId:string) {
    "use cache"
    cacheTag(getJobInfoUserTag(userId));
    return db.query.JobInfoTable.findMany({
        where:eq(JobInfoTable.userId , userId)
    })
}