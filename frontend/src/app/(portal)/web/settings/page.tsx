import ModelView from '@/components/ModelView/ModelView';

const page = () =>{
    return(
        <div>
            <div className='min-h-screen'>
                <ModelView
                    model="User"
                    fields={[
                        { name: "login", label: "Login", type: "char", editable: true },
                        { name: "name", label: "Name", type: "char" },
                        { name: "isActivated", label: "Active", type: "boolean" },
                    ]}
                    />

            </div>
        </div>
    )
}

export default page;