function calculateCalendar(p) {
 const dm=/^(\d{4})-(\d{2})-(\d{2})$/.exec(p.date), tm=/^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(p.time);
 if(!dm||!tm)throw Error('请填写有效的日期和时间');
 const [y,m,d]=dm.slice(1).map(Number),[h,n,s]=[+tm[1],+tm[2],+(tm[3]||0)];
 const dt=new Date(Date.UTC(y,m-1,d,h,n,s));
 if(y<1901||y>2099||dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d||h>23||n>59||s>59)throw Error('日期或时间无效');
 const offset=Number(p.offset??8),sect=Number(p.sect??2);
 if(!Number.isFinite(offset)||offset< -12||offset>14||![1,2].includes(sect))throw Error('时区或换日规则无效');
 const bj=new Date(dt.getTime()+(8-offset-(p.dst?1:0))*3600000);
 const solar=Solar.fromYmdHms(bj.getUTCFullYear(),bj.getUTCMonth()+1,bj.getUTCDate(),bj.getUTCHours(),bj.getUTCMinutes(),bj.getUTCSeconds());
 const lunar=solar.getLunar(),ec=lunar.getEightChar();ec.setSect(sect);
 const pillars=['Year','Month','Day','Time'].map(key=>{const get=suffix=>ec['get'+key+suffix]();return {gz:get(''),wuxing:get('WuXing'),hidden:get('HideGan'),ganGod:key==='Day'?'日主':get('ShiShenGan'),zhiGod:get('ShiShenZhi'),nayin:get('NaYin'),stage:get('DiShi'),void:get('XunKong')}});
 const counts=Object.fromEntries([... '木火土金水'].map(x=>[x,0]));pillars.forEach(p=>[...p.wuxing].forEach(x=>counts[x]++));
 const prev=lunar.getPrevJie(),next=lunar.getNextJie();
 return {pillars,counts,solar:solar.toYmdHms(),lunar:lunar.toString(),prev:prev.getName()+' '+prev.getSolar().toYmdHms(),next:next.getName()+' '+next.getSolar().toYmdHms(),sect};
}
