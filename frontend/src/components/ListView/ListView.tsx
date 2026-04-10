'use client';
import { useEffect , useState  } from "react";
import { apiFetch } from "@/lib/orm_service";
import { FaPlus } from "react-icons/fa";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    const [visibleColumns, setVisibleColumns] = useState<string[]>(fields.map(f => f.name));
    // Default all Field is visible

    const visibleFields = fields.filter(f =>visibleColumns.includes(f.name));



    useEffect(()=>{

        const search = async ()=>{ 
            try {     
                const res =  await apiFetch({
                    url:`/api/${model}/search`,
                    method:"POST",
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
                setRecords(data ?? []);
                setLoading(false);
            } catch (error) {
                console.error(error);
            }

        }

        search();
    },[model,JSON.stringify(domain),order,page])

    if(loading) return <div>Loading</div>
    return(
        <div className="flex flex-col h-[600px] border rounded">

  {/* TABLE HEADER */}
  <table className="w-full table-fixed border-b">
    <thead className=" sticky top-0 z-10">
      <tr>
        {visibleFields.map(f => (
          <th key={f.name} className="p-2 text-left">
            {f.label || f.name}
          </th>
        ))}
        <th className="w-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <FaPlus className="cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 bg-white dark:bg-gray-800 ">
              {fields.map(f => (
                <DropdownMenuLabel key={f.name}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(f.name)}
                      onChange={() =>
                        setVisibleColumns(cols =>
                          cols.includes(f.name)
                            ? cols.filter(c => c !== f.name)
                            : [...cols, f.name]
                        )
                      }
                    />
                    {f.label || f.name}
                  </label>
                </DropdownMenuLabel>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </th>
      </tr>
    </thead>
  </table>

  {/* SCROLLABLE BODY */}
  <div className="flex-1 overflow-y-auto">
    <table className="w-full table-fixed">
      <tbody>
        {records.map(r => (
          <tr key={r._id} className="border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            {visibleFields.map(f => (
              <td key={f.name} className="p-2 truncate">
                {String(r[f.name] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* PAGINATION */}
  <div className="flex justify-end gap-2 p-2 border-t ">
    <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))}>
      Prev
    </Button>
    <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)}>
      Next
    </Button>
  </div>

</div>

    )
    
}