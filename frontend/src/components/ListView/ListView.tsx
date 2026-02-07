'use client';
import { useEffect , useState  } from "react";
import { apiFetch } from "@/lib/orm_service";

type DomainTuple = [string, string , any];
interface FieldConfig {
  name: string;
  label?: string;
  type: string;
  editable?: boolean;
  widget?: string;
}

interface ListViewProps {
  model: string;
  fields: FieldConfig[];
  domain: DomainTuple[];
  order: string;
  limit?:Number;
}

export function ListView ({model, fields , domain , order,limit=20 }:ListViewProps){
    const [records , setRecords ] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page,setPage] = useState(1);

    useEffect(()=>{

        const search = async ()=>{ 
            const res =  await apiFetch({
                url:'/api/User',
                method:"GET",
                headers: { "Content-Type": "application/json" },
                payload:JSON.stringify({
                    model,
                    domain, 
                    order,
                    limit:limit,
                    offset:Number(limit)*(page-1),
                    fields:fields.map(f=>f.name)
                })

            })

            if(!res) return;
            const data = await res.json();
            setRecords(data.records ?? []);
            setLoading(false);
        }

        search();
    },[model,JSON.stringify(domain),order,page])

    if(loading) return <div>Loading</div>
    return(
        <div className="border rounded">
            <table className="w-full">
                <thead>
                    <tr>{fields.map(f=>(
                        <th key={f.name} className="p-2 text-left">
                            {f.label || f.name}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {records.map(r =>(
                        <tr key={r._id} className="border-t">
                            {fields.map(f =>(
                                <td key={f.name} className="p-2">
                                    {String(r[f.name] ?? "")}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            {/* TODO: Need to limit on Next like prev and Pagination should be on top of website */}
            <div className="flex justify-end gap-2 p-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
                <button onClick={()=>setPage(p=>p+1)}>Next</button>
            </div>

        </div>
    )
    
}