"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[7103],{3905:function(e,n,t){t.d(n,{Zo:function(){return c},kt:function(){return m}});var a=t(7294);function r(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function i(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);n&&(a=a.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,a)}return t}function l(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?i(Object(t),!0).forEach((function(n){r(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):i(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function o(e,n){if(null==e)return{};var t,a,r=function(e,n){if(null==e)return{};var t,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)t=i[a],n.indexOf(t)>=0||(r[t]=e[t]);return r}(e,n);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)t=i[a],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(r[t]=e[t])}return r}var p=a.createContext({}),s=function(e){var n=a.useContext(p),t=n;return e&&(t="function"==typeof e?e(n):l(l({},n),e)),t},c=function(e){var n=s(e.components);return a.createElement(p.Provider,{value:n},e.children)},d={inlineCode:"code",wrapper:function(e){var n=e.children;return a.createElement(a.Fragment,{},n)}},u=a.forwardRef((function(e,n){var t=e.components,r=e.mdxType,i=e.originalType,p=e.parentName,c=o(e,["components","mdxType","originalType","parentName"]),u=s(t),m=r,k=u["".concat(p,".").concat(m)]||u[m]||d[m]||i;return t?a.createElement(k,l(l({ref:n},c),{},{components:t})):a.createElement(k,l({ref:n},c))}));function m(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var i=t.length,l=new Array(i);l[0]=u;var o={};for(var p in n)hasOwnProperty.call(n,p)&&(o[p]=n[p]);o.originalType=e,o.mdxType="string"==typeof e?e:r,l[1]=o;for(var s=2;s<i;s++)l[s]=t[s];return a.createElement.apply(null,l)}return a.createElement.apply(null,t)}u.displayName="MDXCreateElement"},247:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return l},contentTitle:function(){return o},metadata:function(){return p},toc:function(){return s},default:function(){return d}});var a=t(2122),r=t(9756),i=(t(7294),t(3905)),l={id:"component.KeySequenceNavigationHandler",title:"Class: KeySequenceNavigationHandler",sidebar_label:"KeySequenceNavigationHandler",custom_edit_url:null},o=void 0,p={unversionedId:"classes/component.KeySequenceNavigationHandler",id:"classes/component.KeySequenceNavigationHandler",isDocsHomePage:!1,title:"Class: KeySequenceNavigationHandler",description:"component.KeySequenceNavigationHandler",source:"@site/api/classes/component.KeySequenceNavigationHandler.md",sourceDirName:"classes",slug:"/classes/component.KeySequenceNavigationHandler",permalink:"/mapillary-js/api/classes/component.KeySequenceNavigationHandler",editUrl:null,version:"current",frontMatter:{id:"component.KeySequenceNavigationHandler",title:"Class: KeySequenceNavigationHandler",sidebar_label:"KeySequenceNavigationHandler",custom_edit_url:null},sidebar:"api",previous:{title:"KeyPlayHandler",permalink:"/mapillary-js/api/classes/component.KeyPlayHandler"},next:{title:"KeySpatialNavigationHandler",permalink:"/mapillary-js/api/classes/component.KeySpatialNavigationHandler"}},s=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Accessors",id:"accessors",children:[{value:"isEnabled",id:"isenabled",children:[]}]},{value:"Methods",id:"methods",children:[{value:"disable",id:"disable",children:[]},{value:"enable",id:"enable",children:[]}]}],c={toc:s};function d(e){var n=e.components,t=(0,r.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,a.Z)({},c,t,{components:n,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".KeySequenceNavigationHandler"),(0,i.kt)("p",null,"The ",(0,i.kt)("inlineCode",{parentName:"p"},"KeySequenceNavigationHandler")," allows the user to navigate through a sequence using the\nfollowing key commands:"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"ALT")," + ",(0,i.kt)("inlineCode",{parentName:"p"},"Up Arrow"),": Navigate to next image in the sequence.\n",(0,i.kt)("inlineCode",{parentName:"p"},"ALT")," + ",(0,i.kt)("inlineCode",{parentName:"p"},"Down Arrow"),": Navigate to previous image in sequence."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"example"))),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},'var keyboardComponent = viewer.getComponent("keyboard");\n\nkeyboardComponent.keySequenceNavigation.disable();\nkeyboardComponent.keySequenceNavigation.enable();\n\nvar isEnabled = keyboardComponent.keySequenceNavigation.isEnabled;\n')),(0,i.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("p",{parentName:"li"},(0,i.kt)("inlineCode",{parentName:"p"},"HandlerBase"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.KeyboardConfiguration"},(0,i.kt)("inlineCode",{parentName:"a"},"KeyboardConfiguration")),">"),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"KeySequenceNavigationHandler"))))),(0,i.kt)("h2",{id:"accessors"},"Accessors"),(0,i.kt)("h3",{id:"isenabled"},"isEnabled"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"isEnabled"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"boolean")),(0,i.kt)("p",null,"Returns a Boolean indicating whether the interaction is enabled."),(0,i.kt)("h4",{id:"returns"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"boolean")),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"true")," if the interaction is enabled."),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/util/HandlerBase.ts#L31"},"component/util/HandlerBase.ts:31")),(0,i.kt)("h2",{id:"methods"},"Methods"),(0,i.kt)("h3",{id:"disable"},"disable"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"disable"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("p",null,"Disables the interaction."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"example"))),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"<component-name>.<handler-name>.disable();\n")),(0,i.kt)("h4",{id:"returns-1"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,i.kt)("p",null,"HandlerBase.disable"),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/util/HandlerBase.ts#L60"},"component/util/HandlerBase.ts:60")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"enable"},"enable"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"enable"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("p",null,"Enables the interaction."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"example"))),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"<component-name>.<handler-name>.enable();\n")),(0,i.kt)("h4",{id:"returns-2"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("h4",{id:"inherited-from-1"},"Inherited from"),(0,i.kt)("p",null,"HandlerBase.enable"),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/util/HandlerBase.ts#L43"},"component/util/HandlerBase.ts:43")))}d.isMDXComponent=!0}}]);