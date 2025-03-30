import React, { useEffect, useState } from "react";
import { fetchInstitutions } from "../api/api";

function InstitutionList() {
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    fetchInstitutions()
      .then((response) => setInstitutions(response.data))
      .catch((error) => console.error("Error fetching institutions:", error));
  }, []);

  return (
    <div>
      <h1>Institutions</h1>
      <ul>
        {institutions.map((institution) => (
          <li key={institution.id}>{institution.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default InstitutionList;