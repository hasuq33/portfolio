import Image from "next/image"

export const generateMetadata = async () =>{
  return {
    "title":"Harshiv Blogs",
    "desciption": "Blogs Written By Harshiv Joshi. "
  }
}

const page = () => {
  return (
    <div className="min-h-screen  py-24 px-20">
      <div className="container">
        <div className="col-6">
          <div className="shadow p-3">
            <Image className="rounded" src="/assets/office.avif" height={250} width={400} alt="Harshiv Blogs"/>
          </div>
        </div>
        <div className="col-6">
          
        </div>
      </div>
    </div>
  )
}

export default page;