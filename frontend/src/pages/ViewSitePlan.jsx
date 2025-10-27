import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api'

export default function ViewSitePlan() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [sp, setSp] = useState(null)

  useEffect(()=>{
    api.get(`projects/${projectId}/`).then(({data})=>setProject(data))
    api.get(`projects/${projectId}/siteplan/`).then(({data})=>setSp(data[0]||null))
  },[projectId])

  if (!sp) {
    return (
      <div className="container">
        <div className="card">
          <p>No Site Plan yet.</p>
          <Link className="btn" to={`/projects/${projectId}/wizard`}>Go to Wizard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
          <h2>مخطط أرض — Land Site Plan</h2>
          <div className="mini">Project: {project?.name}</div>
        </div>
      </div>

      <div className="form-grid cols-4">
        <div className="card">
          <div className="mini">PLOT (Map Placeholder)</div>
          <div style={{height:260, background:'#eef2ff', borderRadius:8}} />
        </div>

        <div className="card" style={{gridColumn:'span 3'}}>
          <div className="section-title">Property Details</div>
          <table className="table"><tbody>
            {row('Municipality', sp.municipality)}
            {row('Zone', sp.zone)}
            {row('Sector', sp.sector)}
            {row('Road Name', sp.road_name)}
            {row('Plot Area (m²)', sp.plot_area_sqm)}
            {row('Plot Area (ft²)', sp.plot_area_sqft)}
            {row('Land No', sp.land_no)}
            {row('Plot Address', sp.plot_address)}
            {row('Construction Status', sp.construction_status)}
            {row('Allocation Type', sp.allocation_type)}
            {row('Land Use', sp.land_use)}
            {row('Base District', sp.base_district)}
            {row('Overlay District', sp.overlay_district)}
            {row('Allocation Date', sp.allocation_date)}
            {row('Project No', sp.project_no)}
            {row('Project Name', sp.project_name)}
            {row('Developer Name', sp.developer_name)}
          </tbody></table>
        </div>
      </div>

      <div className="form-grid cols-4">
        <div className="card" style={{gridColumn:'span 2'}}>
          <div className="section-title">ZONE / SECTOR (mini)</div>
          <div style={{height:120, background:'#f3f4f6', borderRadius:8}} />
        </div>

        <div className="card" style={{gridColumn:'span 2'}}>
          <div className="section-title">Owner Details</div>
          <table className="table">
            <thead><tr><th>Name</th><th>Nationality</th><th>Right Hold</th><th>Share</th></tr></thead>
            <tbody>
              {sp.owners?.map(o=>(
                <tr key={o.id}><td>{o.owner_name}</td><td>{o.nationality}</td><td>{o.right_hold_type}</td><td>{o.share_and_acquisition}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{justifyContent:'space-between'}}>
          <div className="mini">Notes: {sp.notes||'-'}</div>
          <div className="mini">Application #: {sp.application_number} • Date: {sp.application_date||'-'}</div>
        </div>
        <div className="row mt-12">
          <Link className="btn secondary" to={`/projects/${projectId}/wizard`}>Edit</Link>
          <Link className="btn secondary" to="/">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}

function row(label, value){ return <tr><td><b>{label}</b></td><td>{value||'-'}</td></tr> }
