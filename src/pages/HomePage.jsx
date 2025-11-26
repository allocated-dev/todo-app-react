import Hrimg from '../assets/hero image.png'

const Features = [
  {
    id: 1,
    title: "Daily Tasks",
    img: Hrimg,
    Loc: "todos"
  },
  {
    id: 2,
    title: "Budget & Expense Tracker",
    img: Hrimg,
    Loc: "Budget"
  },
  {
    id: 3,
    title: "Notes & Ideas Section",
    img: Hrimg,
    Loc: "Ideas"
  },
  {
    id: 4,
    title: "Daily Planner / Schedule",
    img: Hrimg,
    Loc: "Planner"
  },
  {
    id: 5,
    title: "Focus Timer / Pomodoro Section",
    img: Hrimg,
    Loc: "Timer"
  },
  {
    id: 6,
    title: "Goals & Milestones",
    img: Hrimg,
    Loc: "Goals"
  }, 
]

export default function HomePage() {


  const handleFeatrue = (item)=>{ 
    switch (item) {
      case "todos":
        window.location.pathname = "todos"
        break;
        
        default:
          // window.location.pathname = ""
        break;
    }
    // console.log(window.location.pathname = "Daily Tasks")
  }
  return (
    <div className="bg-gray-300 min-h-screen max-h-[100%] ">
      <header className="hero section max-w-7xl m-auto flex flex-col md:flex-row items-start justify-center gap-5 py-5  ">
        <div className=" flex flex-row items-center justify-center mx-5 md:w-[50%] ">
            <img src={Hrimg} alt="Hero Image" className=' rounded-2xl ' />
        </div>
        <div className="w-full md:w-[50%] py-5 text-center md:text-left  ">
            <h1 className='text-3xl font-semibold font-serif ' >FLOW TASK</h1>  
            <span className='italic'>Welcome to your productivity hub — a dedicated space designed to help you stay organized, manage your tasks effortlessly, and keep track of everything that matters. Here, you can plan your day, streamline your workflow, and stay motivated so you can consistently get things done with confidence and clarity. If you want it more inspirational, professional, or casual, I can rewrite it!</span>
        </div>
      </header>
      <main className='max-w-7xl m-auto py-5'>
        <section className="">
          <div className="flex flex-row items-center justify-center pb-5 mx-5 md:w-[100%] relative ">
            <h2 className='text-2xl font-semibold font-serif'>Features</h2> 
          </div>
          <div className="flex flex-col flex-wrap md:flex-row items-center justify-center gap-5 "> 
            {
              Features?.map((Ftr)=>{
                return(
                  <div key={Ftr.id} className="max-w-xs rounded-4xl bg-amber-600" onClick={()=>{handleFeatrue(Ftr.Loc)}} >
                    <img src={Ftr.img} alt="" className='w-[full] h-[300px] rounded-4xl ' />
                    <span className='text-xl font-bold text-[black] py-5 block text-center '>{Ftr.title}</span>
                  </div>
                );
              })
            }
          </div>
        </section>
      </main>
    </div>
  );
}
