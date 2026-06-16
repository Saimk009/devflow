import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRepoContext } from "@/hooks/useRepoContext"
import { getProviderLabel } from "@/lib/providerUtils"

const demoValue = "__demo__"

export function RepoSelector() {
  const { pinnedRepos, selectedRepo, setSelectedRepo } = useRepoContext()
  const selectedValue = selectedRepo ?? demoValue

  const updateRepo = (value: string) => {
    setSelectedRepo(value === demoValue ? null : value)
  }

  return (
    <Select onValueChange={updateRepo} value={selectedValue}>
      <SelectTrigger aria-label="Select repository" className="w-[280px]">
        <SelectValue placeholder="Select repository" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={demoValue}>Demo Data</SelectItem>
          {pinnedRepos.map((repo) => (
            <SelectItem key={repo.id} value={repo.name}>
              {repo.name} - {getProviderLabel(repo.providerType)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
