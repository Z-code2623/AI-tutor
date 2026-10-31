/* Màn Mô hình ML và bộ giả lập */
// ML screen
$("#nprob").textContent=N;$("#tfm").textContent=`${N} × ${vocab.length}`;$("#csm").textContent=`${N} × ${N}`;
$("#sid").innerHTML=P.map(p=>`<option value="${p.id}">#${p.id} · ${TN[p.topic]}</option>`).join("");
$("#run").onclick=async()=>{const id=+$("#sid").value,sk=+$("#ssk").value,t0=performance.now(),rs=(await apiCall(`/api/recommend?id=${id}&level=${sk}&n=2`))||recommend(id,sk,2);
 $("#log").innerHTML=`&gt; model.fit(cosine_matrix, student_vec)<br>&gt; recommend_next_problems(${id}, ${sk}, top_n=2)<br>&gt; ${rs.length} kết quả · ${(performance.now()-t0).toFixed(1)}ms`;
 $("#simout").innerHTML=rs.map(r=>`<div class="inp" style="display:grid"><div class="row"><span class="chip p">ID #${r.p.id}</span><span class="chip">Diff: Level ${r.p.diff}</span></div><b>${r.p.text}</b><span class="lbl">Cosine similarity: ${r.s.toFixed(4)}</span></div>`).join("")||`<p class="lbl">Không có bài phù hợp.</p>`};
$("#llm").onchange=e=>{apiPost("/api/sync",{settings:{llm:e.target.checked}});toast(e.target.checked?"Đã bật LLM fine-tuned":"Dùng lời giải rule-based");}
$("#dkt").onchange=e=>{apiPost("/api/sync",{settings:{dkt:e.target.checked}});toast(e.target.checked?"Đã bật Deep Knowledge Tracing":"Đã tắt DKT");}

// Số liệu thật từ backend (F1 phân loại, độ chính xác gợi ý, kích thước ma trận)
apiCall("/api/metrics").then(m=>{if(!m)return;$("#nprob").textContent=m.n;$("#tfm").textContent=`${m.n} × ${m.vocab}`;$("#csm").textContent=`${m.n} × ${m.n}`;
 const rows=$$("#mo-hinh .mrow");[m.f1,m.rec_acc].forEach((v,i)=>{rows[i].querySelector(".t span:last-child").textContent=(v*100).toFixed(1)+"%";rows[i].querySelector(".bar i").style.width=v*100+"%"})});
