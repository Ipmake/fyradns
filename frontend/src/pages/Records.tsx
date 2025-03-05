import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
} from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import getBackendURL from "../util/getBackend";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import FilterListIcon from "@mui/icons-material/FilterList";
import EditIcon from "@mui/icons-material/Edit";
import {
  validateAAAAContent,
  validateAContent,
  validateCNAMEContent,
  validateNSContent,
  validatePTRContent,
  validateRecordName,
  validateSOAContent,
  validateSRVContent,
  validateTXTContent,
} from "../util/inputValidate";

// Define the record types based on the Types.RECORD_TYPE
const RECORD_TYPES: Types.RECORD_TYPE[] = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "PTR",
  "SOA",
  "SRV",
  "TXT",
];

// Extend the Types.Record with UI state properties
interface RecordWithUIState extends Types.RecordCreate {
  uiId: string;
  isNew?: boolean;
  isEditing?: boolean;
  hasBeenEdited?: boolean;
  markedForDeletion?: boolean;
}

// Record Editor Component
const RecordEditor = ({
  record,
  records,
  zoneName,
  onSave,
  onCancel,
  onDelete,
}: {
  record: RecordWithUIState;
  records: RecordWithUIState[];
  zoneName: string | undefined;
  onSave: (updatedRecord: RecordWithUIState) => void;
  onCancel: () => void;
  onDelete: () => void;
}) => {
  const [localRecord, setLocalRecord] = useState<RecordWithUIState>({
    ...record,
  });

  const updateField = <K extends keyof RecordWithUIState>(
    field: K,
    value: RecordWithUIState[K]
  ) => {
    setLocalRecord((prev) => ({ ...prev, [field]: value }));
  };

  const isDuplicate: boolean = records.some(
    (r) =>
      r.uiId !== record.uiId &&
      r.name === localRecord.name &&
      r.type === localRecord.type
  );

  const isValid = () => {
    switch (localRecord.type) {
      case "A":
        return validateAContent(localRecord.content);
      case "AAAA":
        return validateAAAAContent(localRecord.content);
      case "CNAME":
        return validateCNAMEContent(localRecord.content);
      case "MX":
        return validateNSContent(localRecord.content);
      case "NS":
        return validateNSContent(localRecord.content);
      case "PTR":
        return validatePTRContent(localRecord.content);
      case "SOA":
        return validateSOAContent(localRecord.content);
      case "SRV":
        return validateSRVContent(localRecord.content);
      case "TXT":
        return validateTXTContent(localRecord.content);
      default:
        return false;
    }
  };

  const valid = isValid();
  const validName = validateRecordName(localRecord.name);

  const getNameHelper = () => {
    if(localRecord.name === "") return "Name is required";
    if(localRecord.name === "@") return `Will be saved as ${zoneName}`;
    if(!validName) return "Invalid name";
    return `Will be saved as ${localRecord.name}.${zoneName}`;
  };

  const getContentHelper = () => {
    if(localRecord.content === "") return "Content is required";
    if(!valid) return "Invalid content";
    return undefined;
  }
 
  return (
    <>
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Name"
          variant="outlined"
          fullWidth
          value={localRecord.name}
          onChange={(e) => updateField("name", e.target.value)}
          helperText={getNameHelper()}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={localRecord.type}
            onChange={(e) =>
              updateField("type", e.target.value as Types.RECORD_TYPE)
            }
            label="Type"
          >
            {RECORD_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <TextField
          label="Content"
          variant="outlined"
          fullWidth
          helperText={getContentHelper()}
          value={localRecord.content}
          onChange={(e) => updateField("content", e.target.value)}
        />
        <TextField
          label="TTL"
          variant="outlined"
          type="number"
          value={localRecord.ttl}
          onChange={(e) => updateField("ttl", parseInt(e.target.value))}
          sx={{ width: 100 }}
        />
        {localRecord.type === "MX" && (
          <TextField
            label="Priority"
            variant="outlined"
            type="number"
            value={localRecord.priority || 0}
            onChange={(e) => updateField("priority", parseInt(e.target.value))}
            sx={{ width: 100 }}
          />
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={localRecord.enabled}
              onChange={(e) => updateField("enabled", e.target.checked)}
              color="primary"
            />
          }
          label="Enabled"
        />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            disabled={isDuplicate || !valid || !validName}
            variant="outlined"
            onClick={() => {
              if (isDuplicate) {
                alert("Record with the same name and type already exists.");
                return;
              }
              onSave({ ...localRecord, isEditing: false, hasBeenEdited: true });
            }}
          >
            Done
          </Button>
          <Button variant="outlined" color="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <IconButton color="error" onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    </>
  );
};

// Record View Component
const RecordView = ({
  record,
  onEdit,
  onDelete,
}: {
  record: RecordWithUIState;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <>
      <Chip
        label={record.type}
        color="primary"
        variant="outlined"
        sx={{
          mr: 2,
          width: 80,
          justifyContent: "center",
        }}
      />

      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1">{record.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          TTL: {record.ttl}
          {record.priority !== undefined && ` | Priority: ${record.priority}`} |
          Last changed:{" "}
          {record.changeDate &&
            new Date(record.changeDate).toLocaleDateString()}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body1">{record.content}</Typography>
        {!record.enabled && (
          <Chip label="Disabled" color="error" size="small" />
        )}
        {record.markedForDeletion && (
          <Chip label="To be deleted" color="error" size="small" />
        )}
      </Box>

      <Box>
        <IconButton onClick={onEdit} disabled={record.markedForDeletion}>
          <EditIcon />
        </IconButton>
        {!record.markedForDeletion && (
          <IconButton color="error" onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        )}
        {record.markedForDeletion && (
          <IconButton color="error" onClick={onDelete}>
            <CancelIcon />
          </IconButton>
        )}
      </Box>
    </>
  );
};

// Record Item Component
const RecordItem = ({
  record,
  records,
  zoneName,
  onSave,
  onDelete,
}: {
  record: RecordWithUIState;
  records: RecordWithUIState[];
  zoneName: string | undefined;
  onSave: (updatedRecord: RecordWithUIState) => void;
  onDelete: (record: RecordWithUIState) => void;
}) => {
  const [isEditing, setIsEditing] = useState(record.isEditing || false);
  // const [originalRecord] = useState(record);

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        display: "flex",
        flexDirection: isEditing ? "column" : "row",
        alignItems: isEditing ? "stretch" : "center",
        gap: 2,
        opacity: record.enabled ? 1 : 0.6,
        backgroundColor: record.markedForDeletion
          ? "rgba(244, 67, 54, 0.08)"
          : undefined,
        borderLeft: record.markedForDeletion
          ? "4px solid rgba(244, 67, 54, 0.5)"
          : undefined,
      }}
    >
      {isEditing ? (
        <RecordEditor
          record={record}
          records={records}
          zoneName={zoneName}
          onSave={(updatedRecord) => {
            setIsEditing(false);
            onSave(updatedRecord);
          }}
          onCancel={() => {
            setIsEditing(false);
            if (record.isNew) {
              onDelete(record);
            }
          }}
          onDelete={() => onDelete(record)}
        />
      ) : (
        <RecordView
          record={record}
          onEdit={() => setIsEditing(true)}
          onDelete={() => onDelete(record)}
        />
      )}
    </Paper>
  );
};

function Records() {
  const { zoneName } = useParams<{ zoneName: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<RecordWithUIState[]>([]);
  const [filterType, setFilterType] = useState<Types.RECORD_TYPE | "">("");
  const [filterName, setFilterName] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if any records are currently being edited
  const hasEditingRecords = useMemo(() => {
    return records.some((record) => record.isEditing);
  }, [records]);

  // Fetch records for the zone
  const fetchRecords = useCallback(() => {
    setLoading(true);
    axios
      .get(`${getBackendURL()}/api/zones/${zoneName}/records`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((res) => {
        // Add unique IDs to each record for UI state management
        const recordsWithIds = res.data.data.map(
          (record: Types.Record, index: number) => ({
            ...record,
            uiId: `${record.name}-${record.type}-${index}`,
          })
        );
        setRecords(recordsWithIds);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch records:", error);
        setError(
          "Failed to fetch records: " +
            (error.response?.data?.message || error.message)
        );
        setLoading(false);
      });
  }, [zoneName]);

  useEffect(() => {
    if (zoneName) {
      fetchRecords();
    }
  }, [zoneName, fetchRecords]);

  // Save all records that have been changed
  const saveChanges = async () => {
    if (hasEditingRecords) {
      setError("Please finish editing all records before saving.");
      return;
    }

    setLoading(true);
    setError(null);

    const recordsToCreate = records
      .filter((r) => r.isNew && !r.markedForDeletion)
      .map((r) => {
        const { ...record } = r;
        return record;
      });

    const recordsToUpdate = records
      .filter((r) => !r.isNew && r.hasBeenEdited && !r.markedForDeletion)
      .map((r) => {
        const { ...record } = r;
        return record;
      });

    const recordsToDelete = records
      .filter((r) => r.markedForDeletion && r.id)
      .map((r) => r.id!);

    try {
      await axios.post(
        `${getBackendURL()}/api/records/batch`,
        {
          create: recordsToCreate.map(
            (record) =>
              ({
                zoneDomain: zoneName || "",
                name: record.name,
                type: record.type,
                content: record.content,
                ttl: record.ttl,
                priority: record.priority,
                enabled: record.enabled,
              } satisfies Types.RecordCreate)
          ),
          update: recordsToUpdate.map(
            (record) =>
              ({
                id: record.id,
                zoneDomain: zoneName || "",
                name: record.name,
                type: record.type,
                content: record.content,
                ttl: record.ttl,
                priority: record.priority,
                enabled: record.enabled,
              } satisfies Types.RecordCreate)
          ),
          delete: recordsToDelete,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );
      setHasChanges(false);
      fetchRecords();
    } catch (error) {
      // Error handling remains the same
      console.error("Failed to save records:", error);
      let errorMessage = "An unknown error occurred";

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError("Failed to save records: " + errorMessage);
      setLoading(false);
    }
  };

  // Add a new empty record
  const addNewRecord = () => {
    const newRecord: RecordWithUIState = {
      zoneDomain: zoneName || "",
      name: "",
      type: "A",
      content: "",
      ttl: 3600,
      changeDate: new Date(),
      enabled: true,
      isNew: true,
      isEditing: true,
      uiId: `new-${Date.now()}`,
    };
    setRecords([...records, newRecord]);
    setHasChanges(true);
  };

  // Delete a record
  const deleteRecord = (record: RecordWithUIState) => {
    if (record.isNew) {
      // Just remove from state if it's a new record
      setRecords(records.filter((r) => r.uiId !== record.uiId));
      return;
    }

    // Toggle the marked for deletion state
    setRecords(
      records.map((r) =>
        r.uiId === record.uiId
          ? { ...r, markedForDeletion: !r.markedForDeletion }
          : r
      )
    );
    setHasChanges(true);
  };

  // Update a record in the main state
  const updateRecord = (updatedRecord: RecordWithUIState) => {
    const newRecords = [...records];
    const index = records.findIndex((r) => r.uiId === updatedRecord.uiId);

    if (index === -1) {
      console.error("Record not found in state:", updatedRecord);
      return;
    }

    newRecords[index] = updatedRecord;

    setRecords(newRecords);
    setHasChanges(true);
  };

  // Filter records based on current filters and sort new records to the top
  const filteredRecords = records
    .filter((record) => {
      return (
        (filterType === "" || record.type === filterType) &&
        (filterName === "" || record.name.includes(filterName))
      );
    })
    .sort((a, b) => {
      // Sort new records to the top
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return 0;
    });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}
    >
      {/* Error message */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={() => navigate("/zones")} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Records for {zoneName}</Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {hasChanges && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={saveChanges}
                disabled={hasEditingRecords}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setHasChanges(false);
                  fetchRecords();
                }}
              >
                Cancel
              </Button>
            </>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={addNewRecord}
          >
            Add Record
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper
        sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}
      >
        <FilterListIcon />
        <TextField
          label="Filter by name"
          variant="outlined"
          size="small"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Record Type</InputLabel>
          <Select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as Types.RECORD_TYPE | "")
            }
            label="Record Type"
          >
            <MenuItem value="">All Types</MenuItem>
            {RECORD_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Records */}
      <Box sx={{ overflowY: "auto", flex: 1 }}>
        {filteredRecords.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography variant="subtitle1" color="text.secondary">
              No records found. Click "Add Record" to create one.
            </Typography>
          </Box>
        ) : (
          filteredRecords.map((record) => (
            <RecordItem
              key={record.uiId}
              record={record}
              records={records}
              zoneName={zoneName}
              onSave={updateRecord}
              onDelete={deleteRecord}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

export default Records;
