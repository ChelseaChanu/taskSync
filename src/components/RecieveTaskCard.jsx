import React from 'react'

function RecieveTaskCard({task, onClick}) {

  return (
    <div onClick={onClick} className="w-[300px] h-[240px] rounded-[10px] flex-shrink-0 flex flex-col justify-center items-start gap-1.5 px-5 py-3 border !border-[#8f8f8f] shadow-[0px_2px_5px_-1px_rgba(50,50,93,0.25)] cursor-pointer">
      <h2 className="text-[18px] !text-[#383839] font-medium">{task.title}</h2>
      <p className="!text-[#383839]">{task.description?.length > 60
          ? task.description.slice(0, 30) + "..."
          : task.description}
      </p>
      <div className="w-full flex flex-row items-center gap-2">
        <div className="w-[100px] flex justify-center items-center !bg-[#0b7be3] p-2 !text-[#eaf2f8] text-sm rounded font-semibold">Priority:</div>
        <p className="text-sm !text-[#2b2c2d]">{task.priority || "Not Set"}</p>
      </div>
      <div className="w-full flex flex-row items-center gap-2">
        <div className="w-[100px] flex justify-center items-center !bg-[#0b7be3] p-2 !text-[#eaf2f8] text-sm rounded font-semibold">Due Date:</div>
        <p className="text-sm !text-[#2b2c2d]">{task.dueDate}</p>
      </div>
      <div className="w-full flex flex-row items-center gap-2">
        <div className="w-[100px] flex justify-center items-center !bg-[#0b7be3] p-2 !text-[#eaf2f8] text-sm rounded font-semibold">Assign By:</div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm !text-[#2b2c2d]">{task.createdByName}</p>
          <p className="text-sm !text-[#2b2c2d]">{task.createdByDesignation}</p>
        </div>
      </div>
    </div>
  )
}

export default RecieveTaskCard;