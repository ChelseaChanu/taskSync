import React from 'react'

function DashboardCard(props) {
  const {title, description, icon, width} = props;
  return (
    <div className="w-[235px] h-[130px] rounded-[20px] flex-shrink-0 flex flex-row justify-items-start items-start gap-2 p-3 shadow-xl border border-[#8f8f8f]">
      <div className={`flex-shrink-0 flex items-start pt-1`}>
        <img src={`/Images/${icon}`} alt="" className={`${width}`}/>
      </div>
      <div className="flex flex-col justify-center gap-1.5 flex-1">
        <div className="h-[28px] flex items-center">
          <h3 className="text-[22px] font-medium text-[#2b2a2a]">{title}</h3>
        </div>
        <p className="">{description}</p>
      </div>
    </div>    
  )
}

export default DashboardCard;