"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[480],{70971:function(e,r,t){t.r(r),t.d(r,{default:function(){return U}});var s=t(57437),a=t(2265),i=t(41448),n=t.n(i),l=t(28027),d=t(79617),o=t(86645),c=t(17156),x=t(63742),m=t(83719),h=t(51847),u=t(33578),p=t(92674),b=t(74691),j=t(87116),f=t(16351),g=t(68884),y=t(86223),N=t(81222),v=t(80832);let k=(0,v.ZP)(l.Z)(e=>{let{theme:r}=e;return{padding:r.spacing(3),marginTop:r.spacing(3)}}),_=(0,v.ZP)(d.Z)(e=>{let{theme:r}=e;return{marginBottom:r.spacing(2)}}),Z=(0,v.ZP)(o.Z)(e=>{let{theme:r}=e;return{minWidth:250}}),A=(0,v.ZP)(c.Z)(e=>{let{theme:r}=e;return{display:"flex",gap:r.spacing(1),marginTop:r.spacing(1)}}),R=e=>{let{data:r,selectedCommodity:t,selectedRegime:i}=e,n=(0,a.useMemo)(()=>{if(t&&i){let e="('".concat(t,"', '").concat(i,"')");return{[e]:r[e]}}return r},[r,t,i]),l=e=>"number"==typeof e?e.toFixed(2):e,d=e=>"number"!=typeof e?"N/A":e<.01?(0,s.jsx)(x.Z,{label:"***",color:"error",size:"small"}):e<.05?(0,s.jsx)(x.Z,{label:"**",color:"warning",size:"small"}):e<.1?(0,s.jsx)(x.Z,{label:"*",color:"default",size:"small"}):(0,s.jsx)(x.Z,{label:"NS",color:"default",size:"small"}),o=(e,r)=>{if(!r||"object"!=typeof r)return(0,s.jsxs)(m.Z,{variant:"body2",color:"textSecondary",children:["No data available for the ",e," test."]});let t=!1;switch(e){case"Engle-Granger":t=r.p_value<.1;break;case"Pedroni":t=r.adf_p_value<.1||r.lb_p_value<.1;break;case"Westerlund":t=r.Gt_p_value<.1||r.Ga_p_value<.1||r.Pt_p_value<.1||r.Pa_p_value<.1;break;default:t=!1}return(0,s.jsxs)(_,{children:[(0,s.jsx)(h.Z,{expandIcon:(0,s.jsx)(N.Z,{}),children:(0,s.jsxs)(m.Z,{variant:"subtitle1",children:[e," Test Results"]})}),(0,s.jsx)(u.Z,{children:(0,s.jsx)(p.Z,{children:(0,s.jsxs)(Z,{size:"small",children:[(0,s.jsx)(b.Z,{children:(0,s.jsxs)(j.Z,{children:[(0,s.jsx)(f.Z,{children:(0,s.jsx)("strong",{children:"Parameter"})}),(0,s.jsx)(f.Z,{align:"right",children:(0,s.jsx)("strong",{children:"Value"})})]})}),(0,s.jsxs)(g.Z,{children:["Engle-Granger"===e?(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(j.Z,{children:[(0,s.jsx)(f.Z,{component:"th",scope:"row",children:"Cointegration Statistic"}),(0,s.jsx)(f.Z,{align:"right",children:l(r.cointegration_statistic)})]}),(0,s.jsxs)(j.Z,{children:[(0,s.jsx)(f.Z,{component:"th",scope:"row",children:"Critical Values"}),(0,s.jsx)(f.Z,{align:"right",children:(0,s.jsxs)(c.Z,{children:[(0,s.jsxs)(m.Z,{variant:"body2",children:["10%: ",l(r.critical_values[0])]}),(0,s.jsxs)(m.Z,{variant:"body2",children:["5%: ",l(r.critical_values[1])]}),(0,s.jsxs)(m.Z,{variant:"body2",children:["1%: ",l(r.critical_values[2])]})]})})]}),(0,s.jsxs)(j.Z,{children:[(0,s.jsx)(f.Z,{component:"th",scope:"row",children:"P-Value"}),(0,s.jsxs)(f.Z,{align:"right",children:[l(r.p_value),(0,s.jsx)(y.Z,{title:"P-Value significance",children:(0,s.jsx)("span",{style:{marginLeft:"8px"},children:d(r.p_value)})})]})]}),(0,s.jsxs)(j.Z,{children:[(0,s.jsx)(f.Z,{component:"th",scope:"row",children:"Indicates Cointegration"}),(0,s.jsx)(f.Z,{align:"right",children:t?(0,s.jsx)(x.Z,{label:"Yes",color:"success",size:"small"}):(0,s.jsx)(x.Z,{label:"No",color:"error",size:"small"})})]})]}):Object.entries(r).map(e=>{let[r,t]=e;return(0,s.jsxs)(j.Z,{children:[(0,s.jsx)(f.Z,{component:"th",scope:"row",children:r.replace(/_/g," ")}),(0,s.jsxs)(f.Z,{align:"right",children:["number"==typeof t?l(t):JSON.stringify(t),r.toLowerCase().includes("p_value")&&(0,s.jsx)(y.Z,{title:"P-Value significance",children:(0,s.jsx)("span",{style:{marginLeft:"8px"},children:d(t)})})]})]},r)}),(0,s.jsxs)(j.Z,{children:[(0,s.jsx)(f.Z,{children:(0,s.jsx)("strong",{children:"Indicates Cointegration"})}),(0,s.jsx)(f.Z,{align:"right",children:t?(0,s.jsx)(x.Z,{label:"Yes",color:"success",size:"small"}):(0,s.jsx)(x.Z,{label:"No",color:"error",size:"small"})})]})]})]})})})]})};return(0,s.jsxs)(k,{elevation:3,children:[(0,s.jsx)(m.Z,{variant:"h5",gutterBottom:!0,children:"Cointegration Analysis Results"}),0===Object.keys(n).length?(0,s.jsx)(m.Z,{children:"No cointegration results available."}):Object.entries(n).map(e=>{let[r,t]=e;if(!t||"object"!=typeof t)return(0,s.jsxs)(m.Z,{color:"textSecondary",children:["No valid data for ",r,"."]},r);let a=r.match(/\('(.+)',\s*'(.+)'\)/),i=a?a[1]:"Unknown Commodity",n=a?a[2]:"Unknown Regime";return(0,s.jsxs)(c.Z,{mb:3,children:[(0,s.jsx)(m.Z,{variant:"h6",gutterBottom:!0,children:"".concat(i," - ").concat(n)}),(0,s.jsx)(c.Z,{mb:2,children:o("Engle-Granger",t.engle_granger)}),(0,s.jsx)(c.Z,{mb:2,children:o("Pedroni",t.pedroni)}),(0,s.jsx)(c.Z,{mb:2,children:o("Westerlund",t.westerlund)}),(0,s.jsxs)(c.Z,{mt:2,children:[(0,s.jsx)(m.Z,{variant:"subtitle1",gutterBottom:!0,children:"Additional Transformations"}),(0,s.jsxs)(A,{children:[(0,s.jsx)(y.Z,{title:"Price Transformation applied to stabilize variance and linearize relationships.",children:(0,s.jsx)(x.Z,{label:"Price Transformation: ".concat(t.price_transformation||"N/A")})}),(0,s.jsx)(y.Z,{title:"Conflict Transformation accounts for differential impact of conflict across regions.",children:(0,s.jsx)(x.Z,{label:"Conflict Transformation: ".concat(t.conflict_transformation||"N/A")})})]})]})]},r)})]})};R.propTypes={data:n().object.isRequired,selectedCommodity:n().string,selectedRegime:n().string};var C=t(35231),S=t(25974),q=t(54142),w=t(2842),F=t(9542),D=t(85475),T=t(20153),G=t(45745);let P=e=>{let{data:r}=e,[t,i]=(0,a.useState)(0);if(!r||0===r.length)return(0,s.jsx)("p",{children:"No data available for Price Differentials."});let n=r.map((e,r)=>{var t;let a=null===(t=e[0])||void 0===t?void 0:t.R_squared;return(0,s.jsxs)("option",{value:r,children:["Model ",r+1," (R\xb2: ",null==a?void 0:a.toFixed(4),")"]},r)}),l=r[t].filter(e=>void 0!==e.Coefficient&&!isNaN(e.Coefficient));return(0,s.jsxs)("div",{children:[(0,s.jsxs)("div",{className:"mb-4",children:[(0,s.jsx)("label",{htmlFor:"modelSelect",className:"mr-2",children:"Select Model:"}),(0,s.jsx)("select",{id:"modelSelect",value:t,onChange:e=>{i(parseInt(e.target.value,10))},className:"bg-gray-800 border border-gray-700 text-white p-2 rounded",children:n})]}),(0,s.jsx)(C.h,{width:"100%",height:400,children:(0,s.jsxs)(S.v,{data:l,children:[(0,s.jsx)(q.q,{stroke:"#4b5563"}),(0,s.jsx)(w.K,{dataKey:"Variable",stroke:"#9ca3af"}),(0,s.jsx)(F.B,{stroke:"#9ca3af"}),(0,s.jsx)(D.u,{formatter:e=>isNaN(e)?"N/A":e.toFixed(6),contentStyle:{backgroundColor:"#1f2937",border:"none",color:"#e5e7eb"}}),(0,s.jsx)(T.D,{}),(0,s.jsx)(G.$,{dataKey:"Coefficient",fill:"#3b82f6",name:"Coefficient"})]})})]})};P.propTypes={data:n().arrayOf(n().array).isRequired};let V=e=>{let{data:r}=e;if(!r||!Array.isArray(r.speed_of_adjustment)||!Array.isArray(r.cointegration_vector)||!Array.isArray(r.short_run_coefficients))return(0,s.jsx)("p",{className:"text-red-500 dark:text-red-300",children:"Invalid or incomplete ECM data."});let t=r.speed_of_adjustment.map((e,t)=>{let s=r.cointegration_vector[t]?r.cointegration_vector[t][0]:"N/A",a=r.short_run_coefficients[t]?r.short_run_coefficients[t]:["N/A","N/A","N/A","N/A"];return{coefficientSet:"Coefficient ".concat(t+1),Alpha:e[0],Beta:s,Gamma1:a[0],Gamma2:a[1],Gamma3:a[2],Gamma4:a[3]}}),i=e=>"N/A"===e?"text-gray-500 dark:text-gray-400":Math.abs(e)>.1?"text-red-600 dark:text-red-400":"text-green-600 dark:text-green-400";return(0,s.jsxs)("div",{className:"overflow-x-auto bg-background dark:bg-gray-800 p-6 rounded-lg shadow-md",children:[(0,s.jsx)("h2",{className:"text-2xl font-semibold mb-6 text-foreground dark:text-foreground",children:"Error Correction Model Coefficients"}),(0,s.jsx)("table",{className:"min-w-full table-auto",children:(0,s.jsx)("tbody",{children:t.map((e,r)=>(0,s.jsxs)(a.Fragment,{children:[(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground",children:e.coefficientSet}),(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 ".concat(i(e.Alpha)),children:"number"==typeof e.Alpha?e.Alpha.toFixed(2):e.Alpha})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground",children:"Beta"}),(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 ".concat(i(e.Beta)),children:"number"==typeof e.Beta?e.Beta.toFixed(2):e.Beta})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground",children:"Gamma 1"}),(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 ".concat(i(e.Gamma1)),children:"number"==typeof e.Gamma1?e.Gamma1.toFixed(2):e.Gamma1})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground",children:"Gamma 2"}),(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 ".concat(i(e.Gamma2)),children:"number"==typeof e.Gamma2?e.Gamma2.toFixed(2):e.Gamma2})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground",children:"Gamma 3"}),(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 ".concat(i(e.Gamma3)),children:"number"==typeof e.Gamma3?e.Gamma3.toFixed(2):e.Gamma3})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground",children:"Gamma 4"}),(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 ".concat(i(e.Gamma4)),children:"number"==typeof e.Gamma4?e.Gamma4.toFixed(2):e.Gamma4})]})]},r))})}),(0,s.jsxs)("div",{className:"mt-6 text-foreground dark:text-foreground text-sm",children:[(0,s.jsx)("h3",{className:"font-semibold mb-2",children:"Coefficient Definitions:"}),(0,s.jsxs)("ul",{className:"list-disc list-inside",children:[(0,s.jsxs)("li",{children:[(0,s.jsx)("strong",{children:"Coefficient 1 (Alpha - α):"})," ",(0,s.jsx)("em",{children:"Speed of Adjustment"})," – Indicates the speed at which the dependent variable returns to equilibrium after a change in the independent variables."]}),(0,s.jsxs)("li",{children:[(0,s.jsx)("strong",{children:"Coefficient 2 (Beta - β):"})," ",(0,s.jsx)("em",{children:"Cointegration Vector"})," – Represents the long-term equilibrium relationship between the dependent and independent variables."]}),(0,s.jsxs)("li",{children:[(0,s.jsx)("strong",{children:"Gamma (γ):"})," ",(0,s.jsx)("em",{children:"Short-Run Coefficients"})," – Capture the short-term dynamics and immediate effects of changes in explanatory variables."]})]}),(0,s.jsxs)("p",{className:"mt-4",children:[(0,s.jsx)("strong",{children:"Note:"})," Coefficients highlighted in ",(0,s.jsx)("span",{className:"text-red-600 dark:text-red-400",children:"red"})," indicate significant values (|value| > 0.1), while those in ",(0,s.jsx)("span",{className:"text-green-600 dark:text-green-400",children:"green"})," are not significant."]})]})]})};V.propTypes={data:n().shape({speed_of_adjustment:n().arrayOf(n().arrayOf(n().number)).isRequired,cointegration_vector:n().arrayOf(n().arrayOf(n().number)).isRequired,short_run_coefficients:n().arrayOf(n().arrayOf(n().number)).isRequired}).isRequired};let O=e=>{let{data:r}=e,t=r.summary;if(!t)return(0,s.jsx)("p",{children:"No summary data available for Spatial Analysis."});let a=Object.keys(t.Coefficient||{}).map(e=>({Variable:e,Coefficient:t.Coefficient[e],"Std. Error":t["Std. Error"][e],"t-statistic":t["t-statistic"][e],"p-value":t["p-value"][e],Significance:t.Significance[e]})).filter(e=>void 0!==e.Coefficient&&!isNaN(e.Coefficient));return(0,s.jsxs)("div",{children:[(0,s.jsx)("h3",{className:"text-lg font-semibold mb-4",children:"Model Coefficients"}),(0,s.jsx)(C.h,{width:"100%",height:400,children:(0,s.jsxs)(S.v,{data:a,children:[(0,s.jsx)(q.q,{stroke:"#4b5563"}),(0,s.jsx)(w.K,{dataKey:"Variable",stroke:"#9ca3af"}),(0,s.jsx)(F.B,{stroke:"#9ca3af"}),(0,s.jsx)(D.u,{formatter:(e,r)=>isNaN(e)?"N/A":e.toFixed(6),contentStyle:{backgroundColor:"#1f2937",border:"none",color:"#e5e7eb"}}),(0,s.jsx)(T.D,{}),(0,s.jsx)(G.$,{dataKey:"Coefficient",fill:"#10b981",name:"Coefficient"}),(0,s.jsx)(G.$,{dataKey:"Std. Error",fill:"#f59e0b",name:"Std. Error"}),(0,s.jsx)(G.$,{dataKey:"t-statistic",fill:"#8b5cf6",name:"t-statistic"}),(0,s.jsx)(G.$,{dataKey:"p-value",fill:"#ef4444",name:"p-value"})]})}),(0,s.jsx)("h3",{className:"text-lg font-semibold mt-8 mb-4",children:"Fit Statistics"}),(0,s.jsx)("div",{className:"grid grid-cols-2 gap-4",children:Object.entries(r.fit_stats||{}).map(e=>{let[r,t]=e;return(0,s.jsxs)("div",{className:"bg-gray-800 p-4 rounded",children:[(0,s.jsx)("p",{className:"text-gray-400",children:r}),(0,s.jsx)("p",{className:"text-white",children:void 0!==t?t.toFixed(4):"N/A"})]},r)})}),(0,s.jsx)("h3",{className:"text-lg font-semibold mt-8 mb-4",children:"Diagnostics"}),(0,s.jsx)("div",{className:"grid grid-cols-2 gap-4",children:Object.entries(r.diagnostics||{}).map(e=>{let[r,t]=e;return(0,s.jsxs)("div",{className:"bg-gray-800 p-4 rounded",children:[(0,s.jsx)("p",{className:"text-gray-400",children:r}),(0,s.jsx)("p",{className:"text-white",children:void 0!==t?t.toFixed(4):"N/A"})]},r)})})]})};O.propTypes={data:n().object.isRequired};let B=e=>{let{data:r}=e;if(!r||"number"!=typeof r.breusch_godfrey_pvalue||"number"!=typeof r.arch_test_pvalue||"number"!=typeof r.jarque_bera_pvalue||"number"!=typeof r.durbin_watson_stat||"number"!=typeof r.skewness||"number"!=typeof r.kurtosis)return(0,s.jsx)("p",{className:"text-red-500 dark:text-red-300",children:"Invalid or incomplete ECM Diagnostics data."});let t=[{metric:"Breusch-Godfrey p-value",value:r.breusch_godfrey_pvalue},{metric:"ARCH Test p-value",value:r.arch_test_pvalue},{metric:"Jarque-Bera p-value",value:r.jarque_bera_pvalue},{metric:"Durbin-Watson Stat",value:r.durbin_watson_stat},{metric:"Skewness",value:r.skewness},{metric:"Kurtosis",value:r.kurtosis}],a=(e,r)=>e.includes("p-value")?r<.01?"text-red-600 dark:text-red-400":r<.05?"text-yellow-500 dark:text-yellow-300":"text-green-600 dark:text-green-400":"text-foreground dark:text-foreground";return(0,s.jsxs)("div",{className:"overflow-x-auto bg-background dark:bg-gray-800 p-6 rounded-lg shadow-md",children:[(0,s.jsx)("h2",{className:"text-2xl font-semibold mb-6 text-foreground dark:text-foreground",children:"ECM Diagnostics Metrics"}),(0,s.jsx)("table",{className:"min-w-full table-auto",children:(0,s.jsx)("tbody",{children:t.map((e,r)=>(0,s.jsxs)("tr",{className:"hover:bg-gray-100 dark:hover:bg-gray-700",children:[(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground",children:e.metric}),(0,s.jsx)("td",{className:"px-6 py-3 border-b border-gray-200 dark:border-gray-700 ".concat(a(e.metric,e.value)),children:"number"==typeof e.value?e.value.toFixed(2):e.value})]},r))})}),(0,s.jsxs)("div",{className:"mt-6 text-foreground dark:text-foreground text-sm",children:[(0,s.jsx)("h3",{className:"font-semibold mb-2",children:"Metric Definitions:"}),(0,s.jsxs)("ul",{className:"list-disc list-inside",children:[(0,s.jsxs)("li",{children:[(0,s.jsx)("strong",{children:"Breusch-Godfrey p-value:"})," Tests for autocorrelation in residuals."]}),(0,s.jsxs)("li",{children:[(0,s.jsx)("strong",{children:"ARCH Test p-value:"})," Tests for heteroscedasticity in residuals."]}),(0,s.jsxs)("li",{children:[(0,s.jsx)("strong",{children:"Jarque-Bera p-value:"})," Tests for normality of residuals."]}),(0,s.jsxs)("li",{children:[(0,s.jsx)("strong",{children:"Durbin-Watson Stat:"})," Measures the presence of autocorrelation in residuals."]}),(0,s.jsxs)("li",{children:[(0,s.jsx)("strong",{children:"Skewness:"})," Measures the asymmetry of the distribution of residuals."]}),(0,s.jsxs)("li",{children:[(0,s.jsx)("strong",{children:"Kurtosis:"}),' Measures the "tailedness" of the distribution of residuals.']})]}),(0,s.jsxs)("div",{className:"mt-4",children:[(0,s.jsx)("p",{children:(0,s.jsx)("strong",{children:"Interpretation of P-Values:"})}),(0,s.jsxs)("ul",{className:"list-disc list-inside",children:[(0,s.jsxs)("li",{className:"text-red-600 dark:text-red-400",children:["Red: Highly significant (p ","<"," 0.01)"]}),(0,s.jsxs)("li",{className:"text-yellow-500 dark:text-yellow-300",children:["Orange: Significant (p ","<"," 0.05)"]}),(0,s.jsxs)("li",{className:"text-green-600 dark:text-green-400",children:["Green: Not significant (p ",">=}"," 0.05)"]})]})]})]})]})};B.propTypes={data:n().shape({breusch_godfrey_pvalue:n().number.isRequired,arch_test_pvalue:n().number.isRequired,jarque_bera_pvalue:n().number.isRequired,durbin_watson_stat:n().number.isRequired,skewness:n().number.isRequired,kurtosis:n().number.isRequired}).isRequired};var M=t(92566),E=t(16638),K=t(92893);let z=e=>{let{data:r,commodity:t,regime:a}=e,i=r.conflict_intensity||{},n=Object.keys(i).map(e=>({lag:"Lag ".concat(e),p_value:i[e]})).sort((e,r)=>parseInt(e.lag.split(" ")[1],10)-parseInt(r.lag.split(" ")[1],10));return(0,s.jsxs)(c.Z,{children:[(0,s.jsxs)(m.Z,{variant:"subtitle2",gutterBottom:!0,children:["Testing if Conflict Intensity Granger Causes ",t," Price Changes under ",a," Regime"]}),(0,s.jsx)(C.h,{width:"100%",height:400,children:(0,s.jsxs)(M.w,{data:n,children:[(0,s.jsx)(q.q,{stroke:"#4b5563"}),(0,s.jsx)(w.K,{dataKey:"lag",stroke:"#9ca3af"}),(0,s.jsx)(F.B,{stroke:"#9ca3af",domain:[0,1],tickFormatter:e=>"".concat((100*e).toFixed(0),"%")}),(0,s.jsx)(D.u,{formatter:e=>null===e||isNaN(e)?"N/A":"".concat((100*e).toFixed(2),"%"),labelFormatter:e=>e,contentStyle:{backgroundColor:"#1f2937",border:"none",color:"#e5e7eb"}}),(0,s.jsx)(T.D,{}),(0,s.jsx)(E.x,{type:"monotone",dataKey:"p_value",stroke:"#ef4444",name:"p-value",dot:{r:4},activeDot:{r:6}}),(0,s.jsx)(K.d,{y:.05,stroke:"#f59e0b",strokeDasharray:"3 3",label:{value:"p = 0.05",position:"insideTopRight",fill:"#f59e0b",fontSize:12}})]})}),(0,s.jsx)(c.Z,{mt:2,children:(0,s.jsxs)(m.Z,{children:[(0,s.jsx)("strong",{children:"Interpretation:"})," Lags where the p-value is below 5%"," ",(0,s.jsx)(x.Z,{label:"p < 0.05",color:"warning",size:"small"})," indicate significant Granger causality from conflict intensity to ",t," price changes."]})})]})};z.propTypes={data:n().object.isRequired,commodity:n().string.isRequired,regime:n().string.isRequired};let I=e=>{let{data:r}=e,t=Object.keys(r);return(0,s.jsx)("div",{className:"overflow-x-auto",children:(0,s.jsxs)("table",{className:"min-w-full bg-gray-800 border border-gray-700",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{className:"py-2 px-4 border-b",children:"Variable"}),(0,s.jsx)("th",{className:"py-2 px-4 border-b",children:"Transformation"}),(0,s.jsx)("th",{className:"py-2 px-4 border-b",children:"ADF Statistic (Original)"}),(0,s.jsx)("th",{className:"py-2 px-4 border-b",children:"ADF p-value (Original)"}),(0,s.jsx)("th",{className:"py-2 px-4 border-b",children:"ADF Stationary (Original)"}),(0,s.jsx)("th",{className:"py-2 px-4 border-b",children:"ADF Statistic (Diff)"}),(0,s.jsx)("th",{className:"py-2 px-4 border-b",children:"ADF p-value (Diff)"}),(0,s.jsx)("th",{className:"py-2 px-4 border-b",children:"ADF Stationary (Diff)"})]})}),(0,s.jsx)("tbody",{children:t.map(e=>{let t=r[e],a=t.results;return(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"py-2 px-4 border-b text-center",children:e}),(0,s.jsx)("td",{className:"py-2 px-4 border-b text-center",children:t.transformation}),(0,s.jsx)("td",{className:"py-2 px-4 border-b text-center",children:void 0!==a.original.ADF["p-value"]?a.original.ADF["p-value"].toFixed(4):"N/A"}),(0,s.jsx)("td",{className:"py-2 px-4 border-b text-center",children:void 0!==a.original.ADF.Stationary?a.original.ADF.Stationary?"Yes":"No":"N/A"}),(0,s.jsx)("td",{className:"py-2 px-4 border-b text-center",children:void 0!==a.diff.ADF.Statistic?a.diff.ADF.Statistic.toFixed(4):"N/A"}),(0,s.jsx)("td",{className:"py-2 px-4 border-b text-center",children:void 0!==a.diff.ADF["p-value"]?a.diff.ADF["p-value"].toFixed(4):"N/A"}),(0,s.jsx)("td",{className:"py-2 px-4 border-b text-center",children:void 0!==a.diff.ADF.Stationary?a.diff.ADF.Stationary?"Yes":"No":"N/A"})]},e)})})]})})};I.propTypes={data:n().object.isRequired};let W=e=>{let{data:r}=e;if(!r)return(0,s.jsx)("p",{children:"No unit root test results available."});let{adfTest:t,kpssTest:a}=r;return(0,s.jsxs)("div",{children:[(0,s.jsx)("h3",{className:"text-lg font-semibold mb-4",children:"Unit Root Test Results"}),(0,s.jsxs)("table",{className:"min-w-full bg-gray-800 border border-gray-700",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{className:"px-4 py-2",children:"Test"}),(0,s.jsx)("th",{className:"px-4 py-2",children:"Statistic"}),(0,s.jsx)("th",{className:"px-4 py-2",children:"P-Value"}),(0,s.jsx)("th",{className:"px-4 py-2",children:"Result"})]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"border px-4 py-2",children:"ADF Test"}),(0,s.jsx)("td",{className:"border px-4 py-2",children:t.statistic}),(0,s.jsx)("td",{className:"border px-4 py-2",children:t.pValue}),(0,s.jsx)("td",{className:"border px-4 py-2",children:t.pValue<.05?"Stationary":"Non-Stationary"})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"border px-4 py-2",children:"KPSS Test"}),(0,s.jsx)("td",{className:"border px-4 py-2",children:a.statistic}),(0,s.jsx)("td",{className:"border px-4 py-2",children:a.pValue}),(0,s.jsx)("td",{className:"border px-4 py-2",children:a.pValue<.05?"Non-Stationary":"Stationary"})]})]})]})]})};W.propTypes={data:n().shape({adfTest:n().shape({statistic:n().number.isRequired,pValue:n().number.isRequired}).isRequired,kpssTest:n().shape({statistic:n().number.isRequired,pValue:n().number.isRequired}).isRequired}).isRequired};let H=e=>{let{data:r}=e;if(!r)return(0,s.jsx)("p",{children:"No diagnostics available."});let{residualsPlotData:t,breuschPaganTest:a,durbinWatsonStatistic:i,normalityTest:n}=r;return(0,s.jsxs)("div",{children:[(0,s.jsx)("h3",{className:"text-lg font-semibold mb-4",children:"Model Diagnostics"}),(0,s.jsx)("div",{className:"mb-6",children:(0,s.jsx)("h4",{className:"font-semibold mb-2",children:"Residuals Plot"})}),(0,s.jsxs)("table",{className:"min-w-full bg-gray-800 border border-gray-700",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{className:"px-4 py-2",children:"Test"}),(0,s.jsx)("th",{className:"px-4 py-2",children:"Statistic"}),(0,s.jsx)("th",{className:"px-4 py-2",children:"P-Value"}),(0,s.jsx)("th",{className:"px-4 py-2",children:"Result"})]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"border px-4 py-2",children:"Breusch-Pagan Test"}),(0,s.jsx)("td",{className:"border px-4 py-2",children:a.statistic}),(0,s.jsx)("td",{className:"border px-4 py-2",children:a.pValue}),(0,s.jsx)("td",{className:"border px-4 py-2",children:a.pValue<.05?"Heteroscedasticity":"Homoscedasticity"})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"border px-4 py-2",children:"Durbin-Watson Statistic"}),(0,s.jsx)("td",{className:"border px-4 py-2",children:i}),(0,s.jsx)("td",{className:"border px-4 py-2",children:"-"}),(0,s.jsx)("td",{className:"border px-4 py-2",children:i<2?"Positive Autocorrelation":"No Autocorrelation"})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{className:"border px-4 py-2",children:"Normality Test"}),(0,s.jsx)("td",{className:"border px-4 py-2",children:n.statistic}),(0,s.jsx)("td",{className:"border px-4 py-2",children:n.pValue}),(0,s.jsx)("td",{className:"border px-4 py-2",children:n.pValue<.05?"Non-Normal Residuals":"Normal Residuals"})]})]})]})]})};H.propTypes={data:n().shape({residualsPlotData:n().array.isRequired,breuschPaganTest:n().shape({statistic:n().number.isRequired,pValue:n().number.isRequired}).isRequired,durbinWatsonStatistic:n().number.isRequired,normalityTest:n().shape({statistic:n().number.isRequired,pValue:n().number.isRequired}).isRequired}).isRequired};let L=e=>{let{results:r,analysisType:t,commodity:a,regime:i}=e;if(!r||Array.isArray(r)&&0===r.length)return(0,s.jsx)("p",{className:"text-gray-700 dark:text-gray-300",children:"No results available for the selected analysis."});let n=()=>Array.isArray(r)?r.find(e=>e.commodity===a&&e.regime===i):r;switch(t){case"Price Differentials":return(0,s.jsx)(P,{data:r});case"Error Correction Model":{let e=n();if(!e)return(0,s.jsxs)("p",{className:"text-gray-700 dark:text-gray-300",children:['No ECM results found for commodity "',a,'" and regime "',i,'".']});return(0,s.jsx)(V,{data:e})}case"Spatial Analysis":return(0,s.jsx)(O,{data:r});case"Cointegration Analysis":return Array.isArray(r)||"object"==typeof r?(0,s.jsx)(R,{data:r,selectedCommodity:a,selectedRegime:i}):(0,s.jsx)("p",{className:"text-gray-700 dark:text-gray-300",children:"Invalid data format for Cointegration Analysis."});case"ECM Diagnostics":{let e=n();if(!e)return(0,s.jsxs)("p",{className:"text-gray-700 dark:text-gray-300",children:['No ECM Diagnostics results found for commodity "',a,'" and regime "',i,'".']});return(0,s.jsx)(B,{data:e})}case"Granger Causality":return(0,s.jsx)(z,{data:r});case"Stationarity":return(0,s.jsx)(I,{data:r});case"Unit Root Tests":return(0,s.jsx)(W,{data:r});case"Model Diagnostics":return(0,s.jsx)(H,{data:r});default:return(0,s.jsxs)("p",{className:"text-gray-700 dark:text-gray-300",children:["Unsupported analysis type: ",t]})}};L.propTypes={results:n().oneOfType([n().arrayOf(n().object),n().object]).isRequired,analysisType:n().string.isRequired,commodity:n().string.isRequired,regime:n().string.isRequired};var U=L}}]);