import React from 'react'

function DashboardCard(props) {
  const {title, description, icon, width} = props;
  return (
    <div class="w-[235px] h-[130px] rounded-[20px] flex-shrink-0 flex flex-row justify-items-start items-start gap-2 p-3 shadow-xl border border-[#8f8f8f]">
      <div class={`flex-shrink-0 flex items-start pt-1`}>
        <img src={`/public/Assets/Icons/${icon}`} alt="" class={`${width}`}/>
      </div>
      <div class="flex flex-col justify-center gap-1.5 flex-1">
        <div className="h-[28px] flex items-center">
          <h3 className="text-[22px] font-medium text-[#2b2a2a]">{title}</h3>
        </div>
        <p class="">{description}</p>
      </div>
    </div>    
  )
}

export default DashboardCard;