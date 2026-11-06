namespace EsnApp.Domain.Common;

/// <summary>
/// Entity that remembers which administrator created it. The name is a snapshot taken at
/// create time, so it survives renames/deletion of the account and needs no Identity join.
/// </summary>
public abstract class CreatorTrackedEntity : BaseEntity
{
    public string? CreatedById { get; set; }

    public string? CreatedByName { get; set; }
}
