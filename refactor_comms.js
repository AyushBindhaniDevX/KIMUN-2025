const fs = require('fs');

let content = fs.readFileSync('app/oasis/page.tsx', 'utf8');

// 1. Remove workstationCommittees state
content = content.replace(/const \[workstationCommittees, setWorkstationCommittees\] = useState<any\[\]>\(INITIAL_COMMITTEES\)\n?/g, '');

// 2. Remove INITIAL_COMMITTEES definition completely
const initialCommsRegex = /\/\/ Indian-context master committee configuration list \(presets\)\s*const INITIAL_COMMITTEES = \[\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\]\n?/g;
content = content.replace(initialCommsRegex, '');

// 3. Replace all references of workstationCommittees with dbCommittees
content = content.replace(/workstationCommittees/g, 'dbCommittees');

// 4. Clean up saveWorkstationBaselineToCloud usages
content = content.replace(/saveWorkstationBaselineToCloud\(INITIAL_COMMITTEES,/g, 'saveWorkstationBaselineToCloud(dbCommittees,');
content = content.replace(/setWorkstationCommittees\(INITIAL_COMMITTEES\)\n?/g, '');
content = content.replace(/if \(val\.committees\) setWorkstationCommittees\(val\.committees\)\n?/g, '');

// 5. Update dbCommitteeForm initial state
const oldDbCommForm = "{ id: '', name: '', description: '', category: '', topics: '', backgroundGuide: '', rules: '', studyGuide: '' }";
const newDbCommForm = "{ id: '', name: '', description: '', category: '', topics: '', backgroundGuide: '', rules: '', studyGuide: '', image: '', target: 30, fee: 1000 }";
content = content.replace(/\{ id: '', name: '', description: '', category: 'Premium Single', topics: '', backgroundGuide: '', rules: '', studyGuide: '' \}/g, 
  "{ id: '', name: '', description: '', category: 'Premium Single', topics: '', backgroundGuide: '', rules: '', studyGuide: '', image: '', target: 30, fee: 1000 }");
content = content.split(oldDbCommForm).join(newDbCommForm);

// 6. Update handleSaveDbCommittee payload
const oldPayload = `      const payload: any = {
        name: dbCommitteeForm.name.trim(),
        description: dbCommitteeForm.description.trim(),
        category: dbCommitteeForm.category.trim(),
        topics: dbCommitteeForm.topics.split(',').map(t => t.trim()).filter(Boolean),
        backgroundGuide: dbCommitteeForm.backgroundGuide.trim(),
        rules: dbCommitteeForm.rules.trim(),
        studyGuide: dbCommitteeForm.studyGuide.trim(),
        updatedAt: new Date().toISOString()
      }`;
const newPayload = `      const payload: any = {
        name: dbCommitteeForm.name.trim(),
        description: dbCommitteeForm.description.trim(),
        category: dbCommitteeForm.category.trim(),
        topics: dbCommitteeForm.topics.split(',').map(t => t.trim()).filter(Boolean),
        backgroundGuide: dbCommitteeForm.backgroundGuide.trim(),
        rules: dbCommitteeForm.rules.trim(),
        studyGuide: dbCommitteeForm.studyGuide.trim(),
        image: dbCommitteeForm.image.trim(),
        target: Number(dbCommitteeForm.target) || 30,
        fee: Number(dbCommitteeForm.fee) || 1000,
        updatedAt: new Date().toISOString()
      }`;
content = content.replace(oldPayload, newPayload);

// 7. Update handleDbFileUpload
const oldUploadType = `type: 'eb_photo' | 'bg_guide' | 'rules' | 'study_guide'`;
const newUploadType = `type: 'eb_photo' | 'bg_guide' | 'rules' | 'study_guide' | 'comm_photo'`;
content = content.replace(oldUploadType, newUploadType);

const oldUploadIfs = `      } else if (type === 'study_guide') {
        setDbCommitteeForm(prev => ({ ...prev, studyGuide: downloadURL }))
      }`;
const newUploadIfs = `      } else if (type === 'study_guide') {
        setDbCommitteeForm(prev => ({ ...prev, studyGuide: downloadURL }))
      } else if (type === 'comm_photo') {
        setDbCommitteeForm(prev => ({ ...prev, image: downloadURL }))
      }`;
content = content.replace(oldUploadIfs, newUploadIfs);

// 8. Update handleSaveCommittee (Finance tab edit)
const handleSaveRegex = /const handleSaveCommittee = \(e: React\.FormEvent\) => \{[\s\S]*?saveWorkstationBaselineToCloud[^\n]*\n  \}/;
const newHandleSaveCommittee = `const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCommittee) return
    try {
      const commRef = ref(firebaseDb, \`committees/\${editingCommittee.id}\`)
      await update(commRef, {
        target: Number(committeeForm.target) || 30,
        fee: Number(committeeForm.fee) || 1000
      })
      triggerNotification('Committee financial targets updated successfully.')
      setShowCommitteeModal(false)
      setEditingCommittee(null)
    } catch (err: any) {
      triggerNotification('Failed to update targets: ' + err.message, 'error')
    }
  }`;
content = content.replace(handleSaveRegex, newHandleSaveCommittee);

// 9. Remove Add Committee button from Finance Tab
const addCommBtnRegex = /<button[\s\S]*?onClick=\{openAddCommitteeModal\}[\s\S]*?Add Committee\s*<\/button>/;
content = content.replace(addCommBtnRegex, '');

// 10. Update saveWorkstationBaselineToCloud
const saveWbRegex = /const saveWorkstationBaselineToCloud = async \(comms: any\[\], exps: any\[\], revs: any\[\]\) => \{[\s\S]*?\}\n  \}/;
const newSaveWb = `const saveWorkstationBaselineToCloud = async (comms: any[], exps: any[], revs: any[]) => {
    try {
      await set(ref(firebaseDb, 'workstation_config'), {
        expenses: exps,
        revenues: revs,
        lastUpdated: new Date().toISOString()
      })
      triggerNotification('Financial models synchronized with cloud.')
    } catch (error: any) {
      triggerNotification('Failed to sync financial baseline: ' + error.message, 'error')
    }
  }`;
content = content.replace(saveWbRegex, newSaveWb);

// 11. Remove setdbCommittees(list) created by the replace
content = content.replace(/setdbCommittees\([^)]*\)\n?/g, '');

// 12. Add UI fields to the dbCommitteeForm modal
const uiTargetStr = `              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Description / Bio</label>`;

const newUiStr = `              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Target Seats</label>
                  <input
                    type="number"
                    value={dbCommitteeForm.target}
                    onChange={e => setDbCommitteeForm(p => ({ ...p, target: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Delegate Fee (₹)</label>
                  <input
                    type="number"
                    value={dbCommitteeForm.fee}
                    onChange={e => setDbCommitteeForm(p => ({ ...p, fee: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Committee Cover Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dbCommitteeForm.image}
                    onChange={e => setDbCommitteeForm(p => ({ ...p, image: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-250 cursor-pointer flex items-center justify-center shrink-0">
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDbFileUpload(e, 'comm_photo')} disabled={isUploadingFile} />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Description / Bio</label>`;
content = content.replace(uiTargetStr, newUiStr);

fs.writeFileSync('app/oasis/page.tsx', content);
console.log("Replaced stuff successfully.");
