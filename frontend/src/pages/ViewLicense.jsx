import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api'

export default function ViewLicense() {
  const { projectId } = useParams()
  const [lic, setLic] = useState(null)

  useEffect(()=>{
    api.get(`projects/${projectId}/license/`).then(({data})=>setLic(data[0]||null))
  },[projectId])

  if (!lic) {
    return (
      <div className="container">
        <div className="card">
          <p>No License yet.</p>
          <Link className="btn" to={`/projects/${projectId}/wizard`}>Go to Wizard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card">
        <h2>بيانات الرخصة — Building License</h2>
      </div>

      <div className="card">
        <div className="section-title">License Details</div>
        <table className="table"><tbody>
          {row('License No', lic.license_no)}
          {row('File Ref', lic.license_file_ref)}
          {row('Issue Date', lic.issue_date)}
          {row('Expiry Date', lic.expiry_date)}
          {row('Stage/Work Type', lic.license_stage_or_worktype)}
          {row('Status', lic.license_status)}
          {row('Project Description', lic.project_description)}
        </tbody></table>
      </div>

      <div className="form-grid cols-4">
        <div className="card" style={{gridColumn:'span 2'}}>
          <div className="section-title">Plot / Land</div>
          <table className="table"><tbody>
            {row('City', lic.city)}{row('Zone', lic.zone)}{row('Sector', lic.sector)}
            {row('Plot No', lic.plot_no)}{row('Plot Address', lic.plot_address)}{row('Plot Area (m²)', lic.plot_area_sqm)}
          </tbody></table>
        </div>
        <div className="card" style={{gridColumn:'span 2'}}>
          <div className="section-title">Parties</div>
          <table className="table"><tbody>
            {row('Owner', lic.owner_name)}
            {row('Consultant', `${lic.consultant_name || ''} ${lic.consultant_license_no ? `(Lic: ${lic.consultant_license_no})` : ''}`)}
            {row('Contractor', `${lic.contractor_name || ''} ${lic.contractor_license_no ? `(Lic: ${lic.contractor_license_no})` : ''}`)}
          </tbody></table>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Technical Decisions</div>
        <table className="table"><tbody>
          {row('Ref', lic.technical_decision_ref)}
          {row('Date', lic.technical_decision_date)}
          {row('Notes', lic.license_notes)}
        </tbody></table>
      </div>

      <div className="row mt-12">
        <Link className="btn secondary" to={`/projects/${projectId}/wizard`}>Edit</Link>
        <Link className="btn secondary" to="/">Dashboard</Link>
      </div>
    </div>
  )
}

function row(label, value){ return <tr><td><b>{label}</b></td><td>{value||'-'}</td></tr> }
